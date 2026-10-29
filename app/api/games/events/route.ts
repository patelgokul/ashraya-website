import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listGameEvents } from "@/lib/games";
import { GameEventSchema } from "@/lib/validations/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await listGameEvents();
  return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
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

  return NextResponse.json(event, { status: 201 });
}
