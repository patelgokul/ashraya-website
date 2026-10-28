import { NextResponse } from "next/server";
import { getCurrentParticipant, getGameBoard } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function GET() {
  const participant = await getCurrentParticipant();
  const board = await getGameBoard(participant?.id ?? null);
  return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
}
