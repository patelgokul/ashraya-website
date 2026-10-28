import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Please register first" }, { status: 401 });
  }

  const { count } = await prisma.gameScore.deleteMany({
    where: { id: params.id, participantId: participant.id },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Score not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
