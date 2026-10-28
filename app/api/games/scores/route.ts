import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameScoreSchema } from "@/lib/validations/game";
import { getCurrentParticipant } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Please register first" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = GameScoreSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const score = await prisma.gameScore.create({
    data: {
      participantId: participant.id,
      game: result.data.game,
      points: result.data.points,
    },
    select: { id: true },
  });

  return NextResponse.json(score, { status: 201 });
}
