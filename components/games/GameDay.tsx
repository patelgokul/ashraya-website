"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock3, HeartHandshake, HelpCircle, KeyRound, LockKeyhole, LogOut, Mic2, Palette, Plus, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { useGameState, type ActionResult } from "@/hooks/useGameState";
import { formatEventDate } from "@/lib/formatEventDate";
import { AddPointsDialog } from "./AddPointsDialog";
import { RegisterCard } from "./RegisterCard";
import { GameLeaderboards, TeamPanel, VerificationForm, VolunteerForm } from "./GamePanels";
import { MyScores, RecentActivity } from "./ScorePanels";
import { RoundPanel } from "./RoundPanel";

const Celebration = dynamic(() => import("./Celebration"), { ssr: false });
const icons = { SONG: Mic2, RIDDLE: HelpCircle, HUNT_LEVEL: KeyRound, SCRIBBLE: Palette, VERIFY: ShieldCheck, VOLUNTEER: HeartHandshake };
const timeText = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0")}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, "0")}`;

export function GameDay({ eventId }: { eventId: string }) {
  const { state, error, now, refresh, act } = useGameState(eventId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("standings");
  const [addOpen, setAddOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [celebration, setCelebration] = useState<(ActionResult & { roundId: string }) | null>(null);
  const [advance, setAdvance] = useState(false);
  const [actionError, setActionError] = useState("");
  const previousLive = useRef("");
  const live = state?.rounds.find((round) => ["LIVE", "DONE"].includes(round.state) && ["SONG", "RIDDLE", "SCRIBBLE"].includes(round.kind) && (!round.endsAt || Date.parse(round.endsAt) > now));
  const hunt = state?.rounds.find((round) => round.kind === "HUNT_LEVEL" && round.unlockedAt && !round.solvedAt && round.state !== "CLOSED");
  const liveKey = live ? `${live.id}:${live.openedAt}` : "";
  useEffect(() => {
    if (liveKey && previousLive.current !== liveKey && live) {
      setExpanded(new Set([live.id])); setTab("rounds");
      window.setTimeout(() => document.getElementById(`round-${live.id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }), 100);
    }
    previousLive.current = liveKey;
  }, [liveKey, live]);
  useEffect(() => { setMuted(localStorage.getItem("game-muted") === "true"); }, []);
  const teamFinish = state?.team ? `${state.team.id}:${state.team.finishedAt ?? ""}` : undefined;
  const previousFinish = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (teamFinish === undefined) return;
    const before = previousFinish.current;
    previousFinish.current = teamFinish;
    if (before === undefined || before === teamFinish || !state?.team?.finishedAt || !state.team.finishPlace) return;
    setCelebration((current) => current ?? { correct: true, points: state.team!.points, finishPlace: state.team!.finishPlace!, roundId: "" });
  }, [teamFinish, state?.team]);
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => { setCelebration(null); setAdvance(true); }, celebration.finishPlace ? 12000 : 2000);
    return () => clearTimeout(timer);
  }, [celebration]);
  useEffect(() => {
    if (!advance || !state) return;
    const next = (live?.state === "LIVE" ? live : null) ?? state.rounds.find((round) => round.state === "LIVE");
    setExpanded(new Set(next ? [next.id] : [])); setAdvance(false);
    if (next) requestAnimationFrame(() => document.getElementById(`round-${next.id}`)?.scrollIntoView({ behavior: "auto", block: "start" }));
  }, [advance, state, live]);

  if (!state) return <div className="mx-auto max-w-xl px-5 py-20 text-center" role="status"><Clock3 className="mx-auto mb-3 h-6 w-6 text-blue-700" />{error ?? "Connecting to Game Day..."}{error && <button className="ml-3 text-blue-700 underline" onClick={refresh}>Retry</button>}</div>;
  if (!state.me) return <div className="mx-auto max-w-xl px-5 py-12">
    <h1 className="mb-8 text-center font-display text-3xl font-bold">{state.event.title}</h1>
    <div className="space-y-10">
      <GameLeaderboards state={state} />
      <RegisterCard company={state.event.company} onRegistered={refresh} />
    </div>
  </div>;
  const remaining = live?.endsAt ? (Date.parse(live.endsAt) - now) / 1000 : null;
  const huntRemaining = state.event.huntDeadlineAt ? Math.max(0, (Date.parse(state.event.huntDeadlineAt) - now) / 1000) : null;
  const huntActive = hunt && huntRemaining !== null && huntRemaining > 0;
  const mine = state.boards.individual.find((entry) => entry.alias === state.me!.alias);
  const regular = state.rounds.length === 0;
  const views = regular ? ["standings", "games"] : ["standings", "rounds", "team"];
  return <div className="game-day min-h-[70vh] bg-white pb-16 text-gray-900">
    <header className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="min-w-0"><Link href="/games" className="text-xs font-semibold text-blue-700">Events / Game Day</Link><h1 className="mt-1 break-words font-display text-xl font-bold sm:text-2xl">{state.event.title}</h1><p className="mt-1 text-xs text-gray-500">{formatEventDate(state.event.eventDate.slice(0, 10))} / {state.event.location}</p></div>
        {!regular && <div className={`w-28 shrink-0 text-right sm:w-40 ${remaining !== null && remaining < 10 ? "text-red-700" : "text-blue-800"}`} aria-label="Round timer"><p className="truncate text-xs font-semibold">{live ? "Round closes in" : huntActive ? "Time on level" : "Next round"}</p><p className="mt-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">{remaining !== null ? timeText(remaining) : huntActive && hunt.unlockedAt ? timeText((now - Date.parse(hunt.unlockedAt)) / 1000) : "--:--"}</p><p className="mt-1 text-[11px] text-gray-500">{huntActive ? `${timeText(huntRemaining!)} hunt left` : live ? live.title : "Waiting for host"}</p></div>}
      </div>
      <div role="tablist" aria-label="Game views" className={`grid border-t border-gray-100 bg-white ${views.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{views.map((view) => <button key={view} role="tab" aria-selected={tab === view} onClick={() => { setTab(view); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" })); }} className={`border-b-2 py-3 text-sm font-semibold capitalize ${view === tab ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500"}`}>{view}</button>)}</div>
    </header>
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 py-3"><div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm"><strong className="break-words">{state.me.name}</strong><span className="text-gray-500">{mine?.points ?? 0} pts / #{mine?.rank ?? "-"}</span></div><div className="flex shrink-0 gap-1">{regular && <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"><Plus className="h-4 w-4" />Add points</button>}{state.me.isAdmin && <Link href={`/games/${eventId}/admin`} title="Host console" aria-label="Host console" className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><ShieldCheck className="h-5 w-5" /></Link>}<button aria-label={muted ? "Unmute celebrations" : "Mute celebrations"} title={muted ? "Unmute celebrations" : "Mute celebrations"} onClick={() => { setMuted(!muted); localStorage.setItem("game-muted", String(!muted)); }} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button><button title="Log out" aria-label="Log out" onClick={async () => { try { const response = await fetch("/api/games/register", { method: "DELETE" }); if (!response.ok) throw new Error("Could not log out. Please retry."); await refresh(); } catch (failure) { setActionError((failure as Error).message); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"><LogOut className="h-4 w-4" />Log out</button></div></div>
      {(error || actionError) && <p role="alert" className="my-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error ? `Reconnecting... ${error}` : actionError}<button onClick={refresh} className="ml-2 underline">Retry</button></p>}
      <div className="pt-6">
        {tab === "standings" && <GameLeaderboards state={state} />}
        {tab === "games" && state.manual && <div className="space-y-6"><MyScores scores={state.manual.mine} /><RecentActivity recent={state.manual.recent} /></div>}
        {tab === "team" && <TeamPanel state={state} act={act} />}
        {tab === "rounds" && <main className="min-w-0"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">The playbook</h2><span className="text-xs font-semibold text-gray-500">{state.rounds.filter((round) => round.state === "DONE").length} / {state.rounds.length} complete</span></div>
          {state.rounds.map((round) => { const Icon = icons[round.kind]; const open = expanded.has(round.id); return <section id={`round-${round.id}`} key={round.id} className="scroll-mt-64 border-b border-gray-200 first:border-t">
            <h3><button aria-expanded={open} aria-controls={`body-${round.id}`} onClick={() => setExpanded((current) => { const next = new Set(current); if (open) next.delete(round.id); else next.add(round.id); return next; })} className={`flex w-full items-center gap-3 px-2 py-5 text-left sm:gap-4 ${round.state === "LIVE" ? "bg-blue-50/60" : ""}`}><span className="w-6 shrink-0 font-mono text-xs text-gray-400">{String(round.order).padStart(2, "0")}</span><Icon className={`h-5 w-5 shrink-0 ${round.state === "DONE" ? "text-emerald-700" : round.state === "LOCKED" ? "text-gray-400" : "text-blue-700"}`} /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold sm:text-base">{round.title}</span><span className="mt-1 flex items-center gap-1 text-xs font-normal text-gray-500">{round.state === "LOCKED" && <LockKeyhole className="h-3 w-3" />}{round.state === "DONE" && <CheckCircle2 className="h-3 w-3 text-emerald-700" />}{round.state === "LOCKED" ? round.lockedReason : round.state === "DONE" ? "Complete" : round.state === "LIVE" ? round.kind === "HUNT_LEVEL" ? `Team · up to ${round.maxPoints.toLocaleString()}` : ["VERIFY", "VOLUNTEER"].includes(round.kind) ? "Open" : "Live now" : "Closed"}</span></span>{round.points > 0 && <span className="shrink-0 text-xs font-bold text-emerald-700">+{round.points}</span>}<ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} /></button></h3>
            {open && <div id={`body-${round.id}`} className="px-3 pb-6 pt-4 sm:px-12">{round.state === "LOCKED" ? <p className="text-sm text-gray-500">{round.lockedReason}</p> : round.kind === "VERIFY" ? <VerificationForm state={state} refresh={refresh} /> : round.kind === "VOLUNTEER" ? <VolunteerForm state={state} refresh={refresh} /> : <RoundPanel round={round} now={now} act={act} onCorrect={(result) => { if (!result.alreadySolved) setCelebration({ ...result, roundId: round.id }); }} />}</div>}
          </section>; })}
          {!state.rounds.length && <p className="py-10 text-sm text-gray-500">The host has not published rounds for this event yet.</p>}
        </main>}
      </div>
    </div>
    {regular && <AddPointsDialog eventId={eventId} games={state.event.games} open={addOpen} onOpenChange={setAddOpen} onAdded={refresh} />}
    {celebration && <Celebration points={(celebration.points ?? 0) + (celebration.bonus ?? 0)} finishPlace={celebration.finishPlace} teamName={state.team?.name} elapsedSec={state.team?.elapsedSec ?? undefined} muted={muted} onClose={() => { setCelebration(null); setAdvance(true); }} />}
  </div>;
}
