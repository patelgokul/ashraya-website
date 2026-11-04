"use client";
import { useEffect, useState } from "react";
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import { CheckCircle2, Trophy } from "lucide-react";

setWasmUrl("/animations/dotlottie-player.wasm");

type Props = { points: number; finishPlace?: number; teamName?: string; elapsedSec?: number; muted: boolean; onClose?: () => void };

export default function Celebration({ points, finishPlace, teamName, elapsedSec, muted, onClose }: Props) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!muted) {
      const audio = new Audio("/sounds/victory-fanfare.wav");
      void audio.play().catch(() => {});
      return () => { audio.pause(); };
    }
  }, [muted]);
  if (finishPlace) return <HuntWinner points={points} finishPlace={finishPlace} teamName={teamName} elapsedSec={elapsedSec} reduced={reduced} onClose={onClose} />;
  return <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-white/90 p-6" role="status" aria-live="polite">
    {!reduced && <DotLottieReact src="/animations/game-confetti.lottie" autoplay className="absolute inset-0 h-full w-full" />}
    <div className="relative max-w-lg text-center"><CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
      <h2 className="font-display text-3xl font-bold text-gray-900">Correct!</h2>
      <p className="mt-3 text-4xl font-bold tabular-nums text-blue-700">+{points}</p>
    </div>
  </div>;
}

function HuntWinner({ points, finishPlace, teamName, elapsedSec, reduced, onClose }: Omit<Props, "muted"> & { finishPlace: number; reduced: boolean }) {
  const first = finishPlace === 1;
  return <div className="hunt-winner fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#1e3a8a_0%,#0f172a_55%,#020617_100%)] p-6 text-white" role="status" aria-live="polite" onClick={onClose}>
    {!reduced && <DotLottieReact src="/animations/hunt-winner.lottie" autoplay loop layout={{ fit: "cover", align: [0.5, 0.5] }} className="pointer-events-none absolute inset-0 h-full w-full" />}
    <div className="hunt-winner-card relative max-w-2xl text-center">
      <div className="hunt-winner-trophy mx-auto mb-6 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 sm:h-44 sm:w-44"><Trophy className="h-20 w-20 text-white drop-shadow-lg sm:h-24 sm:w-24" /></div>
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">{first ? "Treasure found first" : `Treasure found · #${finishPlace}`}</p>
      <h2 className="mt-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text font-display text-4xl font-black text-transparent sm:text-6xl">{first ? "You won the Treasure Hunt!" : "You cracked the Treasure Hunt!"}</h2>
      {teamName && <p className="mt-5 break-words text-2xl font-bold sm:text-3xl">{teamName}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-lg text-blue-100"><span className="font-bold tabular-nums text-white">+{points.toLocaleString()} pts</span>{elapsedSec !== undefined && <span className="tabular-nums">{Math.floor(elapsedSec / 60)}m {Math.round(elapsedSec % 60)}s</span>}</div>
      <p className="mt-8 font-display text-2xl italic text-amber-100 sm:text-3xl">&ldquo;Let&apos;s change one Person&apos;s World&rdquo;</p>
      <p className="mt-10 text-xs text-blue-200">Tap anywhere to continue</p>
    </div>
  </div>;
}
