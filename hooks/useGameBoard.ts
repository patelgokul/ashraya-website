"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameBoardResponse } from "@/types/games";

export function useGameBoard(eventId: string, intervalMs = 4000) {
  const [board, setBoard] = useState<GameBoardResponse | null>(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const res = await fetch(`/api/games/events/${eventId}/board`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Board request failed: ${res.status}`);
      const data: GameBoardResponse = await res.json();
      if (requestId !== latestRequest.current) return;
      setBoard(data);
    } catch {
      // Keep the last leaderboard and let the next poll retry quietly.
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [refresh, intervalMs]);

  return { board, refresh };
}
