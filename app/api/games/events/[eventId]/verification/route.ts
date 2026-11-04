import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { GameError, checkOrigin, gameResponse, gameRoute, requirePlayer } from "@/lib/game-auth";
import { hoursSchema } from "@/lib/validations/game-day";
import { putVerification, removeVerification, screenshotKind } from "@/lib/verification-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest, { params }: { params: { eventId: string } }) {
  return gameRoute(async () => {
    checkOrigin(request);
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_BYTES + 64_000) throw new GameError("Screenshot must be 5 MB or smaller", 413);
    const player = await requirePlayer();
    const event = await prisma.gameEvent.findUnique({ where: { id: params.eventId } });
    if (!event) throw new GameError("Event not found", 404);
    if (!await prisma.gameRegistration.findUnique({ where: { eventId_alias: { eventId: event.id, alias: player.alias } } })) throw new GameError("Open this event before playing");
    const existing = await prisma.scoreVerification.findUnique({ where: { eventId_alias: { eventId: event.id, alias: player.alias } } });

    const form = await request.formData();
    const hours = hoursSchema.parse(form.get("hours"));
    const noteField = form.get("note");
    const note = z.string().trim().max(500).optional().parse(typeof noteField === "string" && noteField.trim() ? noteField : undefined);
    const file = form.get("screenshot");
    if (!(file instanceof File) || file.size === 0) throw new GameError("Attach your Benevity confirmation screenshot");
    if (file.size > MAX_BYTES) throw new GameError("Screenshot must be 5 MB or smaller", 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = screenshotKind(bytes);
    if (!kind) throw new GameError("Use a JPG, PNG, or WEBP screenshot");

    const key = `${event.id}/${player.alias}/${crypto.randomUUID()}.${kind.ext}`;
    await putVerification(key, bytes, kind.contentType);
    try {
      await prisma.scoreVerification.upsert({
        where: { eventId_alias: { eventId: event.id, alias: player.alias } },
        // Uploads count straight away; the host can still reject a wrong screenshot from the console.
        create: { eventId: event.id, alias: player.alias, hours, note, screenshotKey: key, status: "APPROVED" },
        update: { hours, note, screenshotKey: key, status: "APPROVED", rejectReason: null, reviewedBy: null, reviewedAt: null },
      });
    } catch (error) {
      await removeVerification(key).catch(() => undefined);
      throw error;
    }
    if (existing?.screenshotKey && existing.screenshotKey !== key) await removeVerification(existing.screenshotKey).catch(() => undefined);
    return gameResponse({ ok: true });
  });
}
