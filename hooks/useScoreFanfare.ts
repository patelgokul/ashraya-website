"use client";
import { useEffect, useRef } from "react";
import type { GameBoardResponse } from "@/types/games";

const FANFARE_SRC = "/sounds/victory-fanfare.wav";

function getPlayer(ref: { current: HTMLAudioElement | null }) {
  ref.current ??= new Audio(FANFARE_SRC);
  return ref.current;
}

export function useScoreFanfare(board: GameBoardResponse | null) {
  const seenIds = useRef<Set<string> | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unlock = () => {
      const player = getPlayer(playerRef);
      player.volume = 0;
      player.play().then(() => {
        player.pause();
        player.currentTime = 0;
        player.volume = 1;
      }).catch(() => {
        player.volume = 1;
      });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!board) return;
    const ids = board.recent.map((score) => score.id);
    if (seenIds.current === null) {
      seenIds.current = new Set(ids);
      return;
    }
    const hasNewScore = ids.some((id) => !seenIds.current?.has(id));
    ids.forEach((id) => seenIds.current?.add(id));
    if (!hasNewScore) return;

    const player = getPlayer(playerRef);
    player.volume = 1;
    player.currentTime = 0;
    player.play().catch(() => {});
  }, [board]);
}
