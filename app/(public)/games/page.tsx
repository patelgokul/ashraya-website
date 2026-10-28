import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { GameDay } from "@/components/games/GameDay";

export const metadata: Metadata = {
  title: "Game Day — Live Leaderboard",
  description: `Register, add your game points, and follow the live leaderboard at the ${SITE.name} Game Day.`,
};

export default function GamesPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-orange-500" />
            </span>
            Live
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">{SITE.name} Game Day</h1>
          <p className="text-gray-300 leading-relaxed">
            Play games, add your points, and watch the leaderboard update in real time.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <GameDay />
      </div>
    </div>
  );
}
