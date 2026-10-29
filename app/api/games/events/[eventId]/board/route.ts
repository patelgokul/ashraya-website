import { NextResponse } from "next/server";
import { getCurrentParticipant, getGameBoard } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const participant = await getCurrentParticipant();
  const board = await getGameBoard(params.eventId, participant);
  if (!board) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
}
