"use client";
import { useState } from "react";
import { Activity, Trash2 } from "lucide-react";
import type { MyScore, RecentScore } from "@/types/games";

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}

export function MyScores({ scores, onDeleted }: { scores: MyScore[]; onDeleted: () => Promise<void> }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(score: MyScore) {
    if (!window.confirm(`Remove ${score.points} points for ${score.game}?`)) return;
    setDeletingId(score.id);
    await fetch(`/api/games/scores/${score.id}`, { method: "DELETE" });
    await onDeleted();
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">Your Entries</h3>
      {scores.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-500">No points yet. Play a game and add your score!</p>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {scores.map((score) => (
            <li key={score.id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{score.game}</p>
                <p className="text-xs text-gray-400">{timeAgo(score.createdAt)}</p>
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums">+{score.points}</span>
              <button
                onClick={() => handleDelete(score)}
                disabled={deletingId === score.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                aria-label={`Remove ${score.game} entry`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecentActivity({ recent }: { recent: RecentScore[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-600" /> Live Activity
      </h3>
      {recent.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-500">Scores will appear here as people add them.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {recent.map((item) => (
            <li key={item.id} className="px-5 py-2.5 text-sm">
              <span className="font-medium text-gray-900">{item.participantName}</span>
              <span className="text-gray-500"> scored </span>
              <span className="font-semibold text-orange-600">{item.points}</span>
              <span className="text-gray-500"> in {item.game}</span>
              <span className="block text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
