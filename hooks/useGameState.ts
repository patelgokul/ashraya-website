"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "@/lib/game-state";

export type ActionResult = { correct?: boolean; points?: number; bonus?: number; alreadySolved?: boolean; finishPlace?: number; closeCall?: boolean; message?: string; elapsedSec?: number; penaltyPct?: number; attemptsLeft?: number };

export async function gameFetch<Result>(url: string, options?: RequestInit): Promise<Result> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Your action was not confirmed. Please retry.");
  return data;
}

export function useGameState(eventId: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    try {
      const data = await gameFetch<GameState>(`/api/games/events/${eventId}/state`, { signal: controller.current.signal });
      if (requestId !== sequence.current) return;
      setState(data);
      setOffset(Date.parse(data.serverNow) - Date.now());
      setError(null);
    } catch (failure) {
      if (failure instanceof Error && failure.name !== "AbortError" && requestId === sequence.current) setError(failure.message);
    }
  }, [eventId]);
  const live = state?.rounds.some((round) => ["LIVE", "DONE"].includes(round.state) && ["SONG", "RIDDLE", "SCRIBBLE"].includes(round.kind) && round.endsAt && Date.parse(round.endsAt) > now + offset);
  useEffect(() => {
    const visibleRefresh = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const interval = window.setInterval(visibleRefresh, live ? 5000 : 10000);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", visibleRefresh); controller.current?.abort(); };
  }, [refresh, live]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  async function act(payload: object) {
    const result = await gameFetch<ActionResult>(`/api/games/events/${eventId}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await refresh();
    return result;
  }
  return { state, error, now: now + offset, refresh, act };
}