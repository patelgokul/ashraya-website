"use client";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import type { RoundState } from "@/lib/game-state";
import type { ActionResult } from "@/hooks/useGameState";
import { gameButton, gameInput } from "./GamePanels";

function withLinks(text: string) {
  return text.replace(/(?<!\]\()https?:\/\/[^\s<>)\]]+/g, (url) => {
    const core = url.replace(/[.,;:!?]+$/g, "");
    return `[${core}](${core})${url.slice(core.length)}`;
  });
}

export function GameText({ children }: { children: string }) {
  return <div className="space-y-3 break-words text-sm leading-relaxed text-gray-700 [&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_code]:break-all [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_li]:ml-5 [&_li]:list-disc [&_p]:whitespace-pre-wrap"><ReactMarkdown components={{ a: ({ children: label, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{label}</a> }}>{withLinks(children)}</ReactMarkdown></div>;
}

function AnswerInput({ round, question, now, act, onCorrect }: {
  round: RoundState; question: RoundState["questions"][number]; now: number;
  act: (payload: object) => Promise<ActionResult>; onCorrect: (result: ActionResult) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const expired = !!round.endsAt && Date.parse(round.endsAt) <= now;
  const disabled = busy || expired || question.attemptsLeft === 0 || round.state === "CLOSED";
  if (question.correct) return <div className="space-y-2 py-2"><p className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />+{question.points} points</p><p className="break-all text-sm text-gray-600">{question.answer}</p>{question.elapsedSec !== null && <p className="text-xs text-gray-500">{Math.floor(question.elapsedSec / 60)}m {question.elapsedSec % 60}s{round.highestHint > 0 ? ` / Hint ${round.highestHint}: ${question.hints[round.highestHint - 1]?.penaltyPct}% deduction` : " / No hint penalty"}</p>}</div>;
  return <form onSubmit={async (event) => {
    event.preventDefault(); if (inFlight.current || disabled || !answer.trim()) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const result = await act({ action: "answer", questionId: question.id, answer });
      if (result.correct) onCorrect(result);
      else setError(result.message || (result.closeCall ? "So close! Check your spelling." : "Not quite - try again"));
    } catch (failure) { setError((failure as Error).message); } finally { inFlight.current = false; setBusy(false); }
  }} className="space-y-2">
    <label htmlFor={`answer-${question.id}`} className="block text-sm font-medium text-gray-800">{question.prompt ?? "Your answer"}</label>
    <div className={`flex gap-2 ${error ? "game-answer-shake" : ""}`}><input id={`answer-${question.id}`} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={300} disabled={disabled} placeholder={round.kind === "HUNT_LEVEL" ? `key${[3, 4, 5, 7, 8].indexOf(round.order) + 1}_xxxxxxxxxxxx_xxxxx` : undefined} value={answer} onChange={(event) => { setAnswer(event.target.value); setError(""); }} className={gameInput} aria-describedby={`feedback-${question.id}`} /><button type="submit" title="Submit answer" aria-label="Submit answer" disabled={disabled || !answer.trim()} className={`${gameButton} shrink-0 !px-3`}><ArrowRight className="h-5 w-5" /></button></div>
    <p id={`feedback-${question.id}`} aria-live="polite" className={`min-h-5 text-xs ${error ? "text-red-700" : "text-gray-500"}`}>{error || (expired || round.state === "CLOSED" ? "Round closed" : busy ? "Checking answer..." : question.attemptsLeft !== null ? `${question.attemptsLeft} attempts left` : "")}</p>
    {question.revealedAnswer && <p className="text-sm font-semibold text-gray-700">Answer: {question.revealedAnswer}</p>}
  </form>;
}

export function RoundPanel({ round, now, act, onCorrect }: { round: RoundState; now: number; act: (payload: object) => Promise<ActionResult>; onCorrect: (result: ActionResult) => void }) {
  const [hintBusy, setHintBusy] = useState(false);
  const [error, setError] = useState("");
  if (round.state === "LOCKED") return <p className="text-sm text-gray-500">{round.lockedReason}</p>;
  const hunt = round.kind === "HUNT_LEVEL";
  return <div className="space-y-5">
    {round.description && <GameText>{round.description}</GameText>}
    {hunt && <p className="text-xs text-gray-500">The hunt works best on a laptop. You&apos;ll need View Source, downloads and maybe a script.</p>}
    <div className={round.kind === "SCRIBBLE" ? "grid gap-x-5 gap-y-7 sm:grid-cols-2" : "space-y-5"}>{round.questions.map((question) => <div key={question.id} className="min-w-0 space-y-3">
      {question.mediaUrl && <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50"><img src={question.mediaUrl} alt={`Question ${round.questions.indexOf(question) + 1}`} className="h-full w-full object-contain p-3" loading="lazy" /></div>}
      <AnswerInput round={round} question={question} now={now} act={act} onCorrect={(result) => { if (round.kind !== "SCRIBBLE" || round.questions.every((entry) => entry.id === question.id || entry.correct)) onCorrect({ ...result, points: round.kind === "SCRIBBLE" ? round.points + (result.points ?? 0) : result.points }); }} />
      {question.revealOnSolve && <div className="border-l-2 border-emerald-600 pl-4"><GameText>{question.revealOnSolve}</GameText></div>}
      {hunt && question.hints.length > 0 && <div className="space-y-3 border-t border-gray-100 pt-4"><div className="flex flex-wrap gap-2">{question.hints.map((hint) => <button key={hint.order} disabled={hintBusy || round.state !== "LIVE" || (!!round.endsAt && Date.parse(round.endsAt) <= now) || hint.order > round.highestHint + 1 || !!hint.text} onClick={async () => {
        if (!window.confirm(`Hint ${hint.order} will reduce this level's points by ${hint.penaltyPct}%. Open it?`)) return;
        setHintBusy(true); setError("");
        try { await act({ action: "hint", roundId: round.id, hint: hint.order }); } catch (failure) { setError((failure as Error).message); } finally { setHintBusy(false); }
      }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-40"><Lightbulb className="h-3.5 w-3.5" />Hint {hint.order} (-{hint.penaltyPct}%)</button>)}</div>{question.hints.filter((hint) => hint.text).map((hint) => <div key={hint.order} className="border-l-2 border-amber-400 pl-3"><p className="mb-1 text-xs font-semibold text-amber-800">Hint {hint.order}</p><GameText>{hint.text!}</GameText></div>)}</div>}
    </div>)}</div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}