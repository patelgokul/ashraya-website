import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/games";
import { GameError, checkOrigin, gameResponse, gameRoute, requirePlayer } from "@/lib/game-auth";
import { GiveHamperSchema } from "@/lib/validations/give-hamper";
import { kolkataToday, type GiveHamperState, type OfficeLocationId } from "@/lib/give-hamper";

export const dynamic = "force-dynamic";

type Player = { alias: string; name: string; phone: string | null; officeLocation: string | null };

function hamperDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function hamperState(player: Player | null): Promise<GiveHamperState> {
  if (!player) return { me: null, hamper: null, lastHamper: null };
  const latest = await prisma.giveHamper.findFirst({ where: { alias: player.alias }, orderBy: { hamperDate: "desc" } });
  const current = latest && hamperDay(latest.hamperDate) === kolkataToday() ? latest : null;
  return {
    me: { alias: player.alias, name: player.name, phone: player.phone, officeLocation: player.officeLocation as OfficeLocationId | null },
    hamper: current && {
      hoursTracked: Number(current.hoursTracked),
      acceptedAt: new Date(current.acceptedAt).toISOString(),
      updatedAt: new Date(current.updatedAt).toISOString(),
      treasureHuntAt: current.treasureHuntAt && new Date(current.treasureHuntAt).toISOString(),
    },
    lastHamper: latest && !current ? { hoursTracked: Number(latest.hoursTracked), hamperDate: hamperDay(latest.hamperDate) } : null,
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
    const phone = data.phone ?? player.phone;
    const officeLocation = data.officeLocation ?? player.officeLocation;
    if (!officeLocation) throw new GameError("Select your office location");
    if (phone !== player.phone || officeLocation !== player.officeLocation) {
      await prisma.gameParticipant.update({ where: { alias: player.alias }, data: { phone, officeLocation } });
    }

    // One statement per India-time day, so a double tap updates today and tomorrow inserts a new row.
    await prisma.$executeRaw`
      INSERT INTO "GiveHamper" (id, alias, "hamperDate", "hoursTracked", "acceptedAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${player.alias}, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, ${data.hoursTracked}::numeric, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
      ON CONFLICT (alias, "hamperDate") DO UPDATE SET
        "hoursTracked" = EXCLUDED."hoursTracked",
        "updatedAt" = EXCLUDED."updatedAt"`;

    return gameResponse(await hamperState({ ...player, phone, officeLocation }));
  });
}

// Registers the signed-in employee for the Treasure Hunt; repeating it keeps the first time.
export async function POST(req: NextRequest) {
  return gameRoute(async () => {
    checkOrigin(req);
    const player = await requirePlayer();
    const updated = await prisma.$executeRaw`
      UPDATE "GiveHamper" SET "treasureHuntAt" = COALESCE("treasureHuntAt", NOW() AT TIME ZONE 'UTC')
      WHERE alias = ${player.alias} AND "hamperDate" = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`;
    if (!updated) throw new GameError("Accept your Give Hamper first", 409);
    return gameResponse(await hamperState(player));
  });
}
