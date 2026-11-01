import type { Metadata } from "next";
import { GameDay } from "@/components/games/GameDay";

export const metadata: Metadata = {
  title: "Game Day",
};

export default function GameEventPage({ params }: { params: { eventId: string } }) {
  return <GameDay eventId={params.eventId} />;
}
