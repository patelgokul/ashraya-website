"use client";
import { useState } from "react";
import { Building2, ExternalLink, Loader2, Plus } from "lucide-react";
import { useGameBoard } from "@/hooks/useGameBoard";
import { useScoreFanfare } from "@/hooks/useScoreFanfare";
import { RegisterCard } from "./RegisterCard";
import { Leaderboard } from "./Leaderboard";
import { AddPointsDialog } from "./AddPointsDialog";
import { MyScores, RecentActivity } from "./ScorePanels";
import type { GameEventDetails } from "@/types/games";

export function GameDay({ event }: { event: GameEventDetails }) {
  const { board, refresh } = useGameBoard(event.id);
  useScoreFanfare(board);
  const [addOpen, setAddOpen] = useState(false);

  if (!board) {
    return (
      <div className="flex justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!board.me) {
    return <RegisterCard company={event.company} onRegistered={refresh} />;
  }

  async function switchAlias() {
    await fetch("/api/games/register", { method: "DELETE" });
    await refresh();
  }

  const myEntry = board.leaderboard.find((entry) => entry.alias === board.me?.alias);
  const isMicrosoft = event.company.trim().toLowerCase() === "microsoft";

  return (
    <div className="pb-24 lg:pb-0">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {event.givingUrl && <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-orange-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                {isMicrosoft ? (
                  <svg viewBox="0 0 23 23" className="h-6 w-6" aria-hidden="true">
                    <rect x="1" y="1" width="9.5" height="9.5" fill="#f25022" />
                    <rect x="12.5" y="1" width="9.5" height="9.5" fill="#7fba00" />
                    <rect x="1" y="12.5" width="9.5" height="9.5" fill="#00a4ef" />
                    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#ffb900" />
                  </svg>
                ) : (
                  <Building2 className="h-6 w-6 text-blue-700" />
                )}
              </span>
              <div>
                <p className="font-bold text-gray-900">{isMicrosoft ? "Ashraya Shiksha Sarthi" : event.company}</p>
                <h3 className="mt-0.5 font-semibold text-gray-900">Give through {event.company}</h3>
                <p className="mt-1 text-sm text-gray-600">Opens the giving page. Best on your phone.</p>
              </div>
            </div>
            <a
              href={event.givingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Open Giving Page <ExternalLink className="h-4 w-4" />
            </a>
          </div>}
          <Leaderboard entries={board.leaderboard} meAlias={board.me.alias} />
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 text-sm text-blue-100">
              <p className="truncate">Hi, {board.me.name}</p>
              <button onClick={switchAlias} className="flex-shrink-0 text-xs text-blue-200 underline hover:text-white">
                Not you?
              </button>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="font-display text-4xl font-bold tabular-nums">{myEntry?.totalPoints ?? 0}</p>
                <p className="text-xs text-blue-200">total points</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold">#{myEntry?.rank ?? "-"}</p>
                <p className="text-xs text-blue-200">of {board.leaderboard.length}</p>
              </div>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="hidden lg:flex mt-5 w-full items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add Your Points
            </button>
          </div>

          <MyScores scores={board.me.scores} onDeleted={refresh} />
          <RecentActivity recent={board.recent} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-4 bg-white/95 backdrop-blur border-t border-gray-100">
        <button
          onClick={() => setAddOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add Your Points
        </button>
      </div>

      <AddPointsDialog eventId={event.id} games={event.games} open={addOpen} onOpenChange={setAddOpen} onAdded={refresh} />
    </div>
  );
}
