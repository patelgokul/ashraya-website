import type { Metadata } from "next";
import { GameEventScreen } from "@/components/games/GameEventScreen";

export const metadata: Metadata = {
  title: "Live Leaderboard",
};

export default function GameEventPage({ params }: { params: { eventId: string } }) {
  return <GameEventScreen eventId={params.eventId} />;
}
