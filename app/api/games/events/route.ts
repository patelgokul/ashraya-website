import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant, listGameEvents } from "@/lib/games";
import { GameEventSchema } from "@/lib/validations/game";
import { checkOrigin, gameRoute, hasAdminSession, requireGameAdmin } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return gameRoute(async () => {
    const [events, player] = await Promise.all([listGameEvents(), getCurrentParticipant()]);
    return NextResponse.json({ events, canCreate: !!player?.isAdmin && hasAdminSession(player.alias) }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function POST(req: NextRequest) {
  return gameRoute(async () => {
  checkOrigin(req);
  const admin = await requireGameAdmin();
  const body = await req.json().catch(() => null);
  const result = GameEventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const event = await prisma.gameEvent.create({
    data: {
      title: result.data.title,
      company: result.data.company,
      location: result.data.location,
      eventDate: new Date(`${result.data.eventDate}T00:00:00.000Z`),
      games: result.data.games,
      givingUrl: result.data.givingUrl,
    },
    select: { id: true },
  });

  await prisma.gameAudit.create({ data: { actor: admin.alias, eventId: event.id, action: "event.create", detail: { title: result.data.title } } });
  return NextResponse.json(event, { status: 201 });
  });
}
