import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameError, checkOrigin, gameResponse, gameRoute, hasAdminSession, requirePlayer } from "@/lib/game-auth";
import { AdminHamperHoursSchema } from "@/lib/validations/give-hamper";
import { kolkataToday, type HamperAdminRow, type OfficeLocationId } from "@/lib/give-hamper";

export const dynamic = "force-dynamic";

async function adminGate() {
  const player = await requirePlayer();
  if (!player.isAdmin) return { denied: gameResponse({ error: "This alias is not an administrator", code: "NOT_ADMIN" }, 403) };
  if (!hasAdminSession(player.alias)) return { denied: gameResponse({ error: "Enter the admin PIN", code: "PIN_REQUIRED", name: player.name }, 403) };
  return { player };
}

type HamperEntry = { id: string; hoursTracked: unknown; hamperDate: Date; remark: string | null };
type ParticipantRow = {
  alias: string;
  name: string;
  createdAt: Date;
  officeLocation: string | null;
  giveHampers: HamperEntry[];
};

function toRows(participant: ParticipantRow): HamperAdminRow[] {
  const shared = {
    alias: participant.alias,
    name: participant.name,
    officeLocation: participant.officeLocation as OfficeLocationId | null,
    entryDate: new Date(participant.createdAt).toISOString(),
  };
  if (!participant.giveHampers.length) {
    return [{ ...shared, id: null, hoursTracked: null, remark: null }];
  }
  return participant.giveHampers.map((hamper) => ({
    ...shared,
    id: hamper.id,
    hoursTracked: Number(hamper.hoursTracked),
    remark: hamper.remark,
  }));
}

const rowSelect = {
  alias: true, name: true, createdAt: true, officeLocation: true,
  giveHampers: { select: { id: true, hoursTracked: true, hamperDate: true, remark: true }, orderBy: { hamperDate: "desc" as const } },
};

export async function GET() {
  return gameRoute(async () => {
    const gate = await adminGate();
    if ("denied" in gate) return gate.denied;
    const participants = await prisma.gameParticipant.findMany({ orderBy: { createdAt: "desc" }, select: rowSelect });
    return gameResponse({ rows: participants.flatMap(toRows) });
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

    if (data.id) {
      const updated = await prisma.giveHamper.updateMany({ where: { id: data.id, alias: data.alias }, data: { hoursTracked: data.hoursTracked, remark: data.remark } });
      if (!updated.count) throw new GameError("Hamper entry not found", 404);
    } else {
      await prisma.$executeRaw`
        INSERT INTO "GiveHamper" (id, alias, "hamperDate", "hoursTracked", "remark", "acceptedAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${data.alias}, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, ${data.hoursTracked}::numeric, ${data.remark}, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
        ON CONFLICT (alias, "hamperDate") DO UPDATE SET
          "hoursTracked" = EXCLUDED."hoursTracked",
          "remark" = EXCLUDED."remark",
          "updatedAt" = EXCLUDED."updatedAt"`;
    }
    await prisma.gameAudit.create({
      data: { actor: gate.player.alias, action: "hamper.hours", detail: { alias: data.alias, id: data.id ?? null, hoursTracked: data.hoursTracked, remark: data.remark } },
    });

    const participant = await prisma.gameParticipant.findUnique({ where: { alias: data.alias }, select: rowSelect });
    const rows = toRows(participant!);
    const today = kolkataToday();
    const row = data.id
      ? rows.find((entry) => entry.id === data.id)
      : rows.find((entry) => participant!.giveHampers.some((hamper) => hamper.id === entry.id && new Date(hamper.hamperDate).toISOString().slice(0, 10) === today));
    return gameResponse({ row });
  });
}
