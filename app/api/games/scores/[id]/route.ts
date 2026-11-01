import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GameError, checkOrigin, gameCommand, gameRoute, requireGameAdmin } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return gameRoute(async () => {
    checkOrigin(_req);
    const admin = await requireGameAdmin();
    const { reason } = z.object({ reason: z.string().trim().min(3).max(500) }).parse(await _req.json());
    const score = await prisma.gameScore.findUnique({ where: { id: params.id } });
    if (!score) throw new GameError("Score not found", 404);
    return NextResponse.json(await gameCommand(score.eventId, admin.alias, "admin.score.void", { scoreId: score.id, reason }));
  });
}
