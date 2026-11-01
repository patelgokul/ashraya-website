import type { Metadata } from "next";
import { GameAdmin } from "@/components/games/GameAdmin";

export const metadata: Metadata = { title: "Game Day Host Console", robots: { index: false, follow: false } };

export default function GameAdminPage({ params }: { params: { eventId: string } }) {
  return <GameAdmin eventId={params.eventId} />;
}