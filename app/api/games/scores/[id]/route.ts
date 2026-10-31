import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const [score, participant] = await Promise.all([
    prisma.gameScore.findUnique({ where: { id: params.id }, select: { alias: true } }),
    getCurrentParticipant(),
  ]);
  if (!score || !participant || score.alias !== participant.alias) {
    return NextResponse.json({ error: "Score not found" }, { status: 404 });
  }

  await prisma.gameScore.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
