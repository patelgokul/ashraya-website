import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameError, checkOrigin, gameResponse, gameRoute, hasAdminSession, requirePlayer } from "@/lib/game-auth";
import { AdminHamperHoursSchema } from "@/lib/validations/give-hamper";
import type { HamperAdminRow, OfficeLocationId } from "@/lib/give-hamper";

export const dynamic = "force-dynamic";

async function adminGate() {
  const player = await requirePlayer();
  if (!player.isAdmin) return { denied: gameResponse({ error: "This alias is not an administrator", code: "NOT_ADMIN" }, 403) };
  if (!hasAdminSession(player.alias)) return { denied: gameResponse({ error: "Enter the admin PIN", code: "PIN_REQUIRED", name: player.name }, 403) };
  return { player };
}

type ParticipantRow = {
  alias: string;
  name: string;
  createdAt: Date;
  officeLocation: string | null;
  giveHamper: { hoursTracked: unknown } | null;
};

function toRow(participant: ParticipantRow): HamperAdminRow {
  return {
    alias: participant.alias,
    name: participant.name,
    registeredAt: new Date(participant.createdAt).toISOString(),
    officeLocation: participant.officeLocation as OfficeLocationId | null,
    hoursTracked: participant.giveHamper ? Number(participant.giveHamper.hoursTracked) : null,
  };
}

const rowSelect = { alias: true, name: true, createdAt: true, officeLocation: true, giveHamper: { select: { hoursTracked: true } } } as const;

export async function GET() {
  return gameRoute(async () => {
    const gate = await adminGate();
    if ("denied" in gate) return gate.denied;
    const participants = await prisma.gameParticipant.findMany({ orderBy: { createdAt: "desc" }, select: rowSelect });
    return gameResponse({ rows: participants.map(toRow) });
  });
}

// Adds or corrects the hours on behalf of a participant; creates the hamper row if they never submitted.
export async function PUT(req: NextRequest) {
  return gameRoute(async () => {
    checkOrigin(req);
    const gate = await adminGate();
    if ("denied" in gate) return gate.denied;
    const data = AdminHamperHoursSchema.parse(await req.json().catch(() => null));
    const exists = await prisma.gameParticipant.findUnique({ where: { alias: data.alias }, select: { alias: true } });
    if (!exists) throw new GameError("Participant not found", 404);

    await prisma.$executeRaw`
      INSERT INTO "GiveHamper" (alias, "hoursTracked", "acceptedAt", "updatedAt")
      VALUES (${data.alias}, ${data.hoursTracked}::numeric, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
      ON CONFLICT (alias) DO UPDATE SET
        "hoursTracked" = EXCLUDED."hoursTracked",
        "updatedAt" = EXCLUDED."updatedAt"`;
    await prisma.gameAudit.create({
      data: { actor: gate.player.alias, action: "hamper.hours", detail: { alias: data.alias, hoursTracked: data.hoursTracked } },
    });

    const participant = await prisma.gameParticipant.findUnique({ where: { alias: data.alias }, select: rowSelect });
    return gameResponse({ row: toRow(participant!) });
  });
}
