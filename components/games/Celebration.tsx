"use client";
import { useEffect, useState } from "react";
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import { CheckCircle2, Trophy } from "lucide-react";

setWasmUrl("/animations/dotlottie-player.wasm");

export default function Celebration({ points, finishPlace, teamName, elapsedSec, muted }: { points: number; finishPlace?: number; teamName?: string; elapsedSec?: number; muted: boolean }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!muted) {
      const audio = new Audio("/sounds/victory-fanfare.wav");
      void audio.play().catch(() => {});
      return () => { audio.pause(); };
    }
  }, [muted]);
  const Icon = finishPlace ? Trophy : CheckCircle2;
  return <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-white/90 p-6" role="status" aria-live="polite">
    {!reduced && <DotLottieReact src="/animations/game-confetti.lottie" autoplay className="absolute inset-0 h-full w-full" />}
    <div className="relative max-w-lg text-center"><Icon className={`mx-auto mb-4 ${finishPlace === 1 ? "h-24 w-24 text-amber-500" : "h-16 w-16 text-emerald-600"}`} />
      <h2 className="font-display text-3xl font-bold text-gray-900">{finishPlace === 1 ? "You found the treasure! You're the winners!" : finishPlace ? `Treasure unlocked - you finished #${finishPlace}` : "Correct!"}</h2>
      <p className="mt-3 text-4xl font-bold tabular-nums text-blue-700">+{points}</p>
      {finishPlace && <><p className="mt-3 text-lg font-semibold">{teamName}</p>{elapsedSec !== undefined && <p className="mt-1 text-sm text-gray-600">{Math.floor(elapsedSec / 60)}m {Math.round(elapsedSec % 60)}s total</p>}<p className="mt-4 font-display text-xl">Let&apos;s change one Person&apos;s World</p></>}
    </div>
  </div>;
}