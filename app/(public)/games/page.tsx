import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { EventsHome } from "@/components/games/EventsHome";

export const metadata: Metadata = {
  title: "Events",
  description: `Game events hosted by ${SITE.name}. Open an event to register, add points, and follow the live leaderboard.`,
};

export default function GamesPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">{SITE.name} Events</h1>
          <p className="text-gray-300 leading-relaxed">
            Choose an event to join its leaderboard, or create a new one.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <EventsHome />
      </div>
    </div>
  );
}
