import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/games";
import { GameError, checkOrigin, gameResponse, gameRoute, requirePlayer } from "@/lib/game-auth";
import { GiveHamperSchema } from "@/lib/validations/give-hamper";
import type { GiveHamperState, OfficeLocationId } from "@/lib/give-hamper";

export const dynamic = "force-dynamic";

async function hamperState(player: { alias: string; name: string; phone: string | null } | null): Promise<GiveHamperState> {
  if (!player) return { me: null, hamper: null };
  const hamper = await prisma.giveHamper.findUnique({ where: { alias: player.alias } });
  return {
    me: { alias: player.alias, name: player.name, phone: player.phone },
    hamper: hamper && {
      officeLocation: hamper.officeLocation as OfficeLocationId,
      hoursTracked: Number(hamper.hoursTracked),
      acceptedAt: new Date(hamper.acceptedAt).toISOString(),
      updatedAt: new Date(hamper.updatedAt).toISOString(),
      treasureHuntAt: hamper.treasureHuntAt && new Date(hamper.treasureHuntAt).toISOString(),
    },
  };
}

export async function GET() {
  return gameRoute(async () => gameResponse(await hamperState(await getCurrentParticipant())));
}

export async function PUT(req: NextRequest) {
  return gameRoute(async () => {
    checkOrigin(req);
    const player = await requirePlayer();
    const data = GiveHamperSchema.parse(await req.json().catch(() => null));
    if (!player.phone && !data.phone) throw new GameError("Add your mobile number");
    if (data.phone && data.phone !== player.phone) {
      await prisma.gameParticipant.update({ where: { alias: player.alias }, data: { phone: data.phone } });
    }

    // One statement, so a double tap or a second device can never create a duplicate row.
    await prisma.$executeRaw`
      INSERT INTO "GiveHamper" (alias, "officeLocation", "hoursTracked", "acceptedAt", "updatedAt")
      VALUES (${player.alias}, ${data.officeLocation}, ${data.hoursTracked}::numeric, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
      ON CONFLICT (alias) DO UPDATE SET
        "officeLocation" = EXCLUDED."officeLocation",
        "hoursTracked" = EXCLUDED."hoursTracked",
        "updatedAt" = EXCLUDED."updatedAt"`;

    return gameResponse(await hamperState({ ...player, phone: data.phone ?? player.phone }));
  });
}

// Registers the signed-in employee for the Treasure Hunt; repeating it keeps the first time.
export async function POST(req: NextRequest) {
  return gameRoute(async () => {
    checkOrigin(req);
    const player = await requirePlayer();
    const updated = await prisma.$executeRaw`
      UPDATE "GiveHamper" SET "treasureHuntAt" = COALESCE("treasureHuntAt", NOW() AT TIME ZONE 'UTC')
      WHERE alias = ${player.alias}`;
    if (!updated) throw new GameError("Accept your Give Hamper first", 409);
    return gameResponse(await hamperState(player));
  });
}
