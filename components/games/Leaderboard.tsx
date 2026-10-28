"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/types/games";

const PODIUM_STYLES: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-950",
  2: "bg-gray-300 text-gray-800",
  3: "bg-orange-300 text-orange-950",
};

export function Leaderboard({ entries, meId }: { entries: LeaderboardEntry[]; meId: string | null }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" /> Leaderboard
        </h2>
        <span className="text-xs text-gray-500">{entries.length} participants</span>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">No participants yet. Be the first!</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {entries.map((entry) => {
              const isMe = entry.id === meId;
              return (
                <motion.li
                  key={entry.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-blue-50" : ""}`}
                >
                  <span
                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                      PODIUM_STYLES[entry.rank] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {entry.rank === 1 && entry.totalPoints > 0 ? <Crown className="w-4 h-4" /> : entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? "text-blue-800" : "text-gray-900"}`}>
                      {entry.name} {isMe && <span className="text-xs font-normal text-blue-600">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {entry.alias && <span className="text-orange-600 font-medium">&ldquo;{entry.alias}&rdquo; · </span>}
                      {entry.entries} {entry.entries === 1 ? "game" : "games"} played
                    </p>
                  </div>
                  <span className="font-display text-lg font-bold text-gray-900 tabular-nums">{entry.totalPoints}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
