"use client";
import { useState } from "react";
import { ExternalLink, Loader2, Plus, Smartphone } from "lucide-react";
import { useGameBoard } from "@/hooks/useGameBoard";
import { RegisterCard } from "./RegisterCard";
import { Leaderboard } from "./Leaderboard";
import { AddPointsDialog } from "./AddPointsDialog";
import { MyScores, RecentActivity } from "./ScorePanels";

const eventDeepLink =
  process.env.NEXT_PUBLIC_GAME_EVENT_URL?.trim() ||
  "https://microsoft.benevity.org/cause/356-5501917747757_1ec1/project/60EX9W3L5D";

export function GameDay() {
  const { board, error, refresh } = useGameBoard();
  const [addOpen, setAddOpen] = useState(false);

  if (!board) {
    return (
      <div className="flex justify-center py-20 text-gray-400">
        {error ? <p className="text-sm text-red-500">{error}</p> : <Loader2 className="w-6 h-6 animate-spin" />}
      </div>
    );
  }

  if (!board.me) {
    return <RegisterCard onRegistered={refresh} />;
  }

  const myEntry = board.leaderboard.find((entry) => entry.id === board.me?.id);

  return (
    <div className="pb-24 lg:pb-0">
      {error && (
        <p className="mb-4 text-center text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg py-2">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Leaderboard entries={board.leaderboard} meId={board.me.id} />
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-orange-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-600 p-2.5 text-white">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Give through Microsoft</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Opens the Benevity giving page. Best on your phone.
                </p>
              </div>
            </div>
            {eventDeepLink ? (
              <a
                href={eventDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:w-auto"
              >
                Open Giving Page <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-300 px-5 py-3 text-sm font-bold text-gray-600 sm:w-auto"
              >
                Event link coming soon
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-blue-100">Hi, {board.me.name}</p>
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

      <AddPointsDialog open={addOpen} onOpenChange={setAddOpen} games={board.games} onAdded={refresh} />
    </div>
  );
}
