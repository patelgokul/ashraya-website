import { prisma } from "@/lib/prisma";
import { GameError, gameRoute, requireGameAdmin } from "@/lib/game-auth";
import { readVerification } from "@/lib/verification-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { eventId: string; alias: string } }) {
  return gameRoute(async () => {
    await requireGameAdmin();
    const alias = params.alias.trim().toLowerCase();
    const entry = await prisma.scoreVerification.findUnique({ where: { eventId_alias: { eventId: params.eventId, alias } } });
    if (!entry?.screenshotKey) throw new GameError("Screenshot not found", 404);
    const file = await readVerification(entry.screenshotKey);
    if (!file) throw new GameError("Screenshot not found", 404);
    return new Response(Uint8Array.from(file.body), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
