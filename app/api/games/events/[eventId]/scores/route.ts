import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameScoreSchema } from "@/lib/validations/game";
import { adminActionSchema } from "@/lib/validations/game-day";
import { GameError, checkOrigin, gameCommand, gameRoute, requireGameAdmin, requirePlayer } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  return gameRoute(async () => {
    checkOrigin(req);
    const event = await prisma.gameEvent.findUnique({ where: { id: params.eventId }, select: { id: true, games: true, _count: { select: { rounds: true } } } });
    if (!event) throw new GameError("Event not found", 404);
    const body = await req.json().catch(() => null);
    if (event._count.rounds > 0) {
      const admin = await requireGameAdmin();
      const action = adminActionSchema.parse({ ...body, action: "admin.score.award" });
      if (action.action !== "admin.score.award" || (!action.alias && !action.teamId)) throw new GameError("Choose a player or team");
      return NextResponse.json(await gameCommand(params.eventId, admin.alias, action.action, action));
    }
    const player = await requirePlayer();
    try {
      await prisma.gameRegistration.create({ data: { eventId: event.id, alias: player.alias } });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
    }
    const scoreInput = GameScoreSchema.safeParse(body);
    if (!scoreInput.success) throw new GameError(scoreInput.error.issues[0]?.message ?? "Invalid score");
    if (!event.games.includes(scoreInput.data.game)) throw new GameError("Please select a game from this event");
    const score = await prisma.gameScore.create({
      data: { alias: player.alias, eventId: event.id, game: scoreInput.data.game, points: scoreInput.data.points },
      select: { id: true },
    });
    return NextResponse.json(score, { status: 201 });
  });
}
