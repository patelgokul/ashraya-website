"use client";
import { useState } from "react";
import { CheckCircle2, Crown, ExternalLink, LogOut, Plus, UserPlus, Users, X } from "lucide-react";
import type { GameState } from "@/lib/game-state";
import { gameFetch, type ActionResult } from "@/hooks/useGameState";
import { volunteerInterests } from "@/lib/validations/game-day";

export const gameInput = "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";
export const gameButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
type Act = (payload: object) => Promise<ActionResult>;

export function Verified({ approved }: { approved: boolean }) {
  return approved ? <CheckCircle2 className="inline h-4 w-4 shrink-0 text-emerald-700" aria-label="Benevity approved" /> : null;
}

export function TeamPanel({ state, act }: { state: GameState; act: Act }) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const team = state.team;
  const captain = team?.captainAlias === state.me?.alias;
  async function run(payload: object) {
    if (busy) return;
    setBusy(true); setError("");
    try { await act(payload); setName(""); } catch (failure) { setError((failure as Error).message); } finally { setBusy(false); }
  }
  return <section aria-label="My team" className="border-y border-gray-200 py-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Users className="h-5 w-5 text-blue-700" />{team?.name ?? "Your hunt team"}</h2>
      <span className="text-xs font-semibold text-gray-500">{state.event.teamsLocked ? "Membership locked" : "Up to 5 players"}</span>
    </div>
    {team ? <>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><strong>{team.points.toLocaleString()} pts</strong><span>{team.finishedAt ? `Finished #${team.finishPlace}` : `Level ${team.level}`}</span><span>{team.members.length}/5 members</span></div>
      <ul className="mt-3 divide-y divide-gray-100">{team.members.map((member) => <li key={member.alias} className="flex min-h-10 items-center gap-2 text-sm"><span className="min-w-0 break-all">{member.alias}</span><Verified approved={member.verified} />{member.alias === team.captainAlias && <Crown className="h-4 w-4 text-amber-600" aria-label="Captain" />}
        {!state.event.teamsLocked && (captain || member.alias === state.me?.alias) && <button title={member.alias === state.me?.alias ? "Leave team" : "Remove member"} aria-label={member.alias === state.me?.alias ? "Leave team" : `Remove ${member.alias}`} disabled={busy} onClick={() => run({ action: "team.leave", teamId: team.id, alias: member.alias })} className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700">{member.alias === state.me?.alias ? <LogOut className="h-4 w-4" /> : <X className="h-4 w-4" />}</button>}
      </li>)}</ul>
      {state.rounds.filter((round) => round.kind === "HUNT_LEVEL" && round.unlockedAt && !round.solvedAt).map((round) => <p key={round.id} className="mt-3 text-xs text-gray-500">{round.title} · {round.highestHint}/3 hints used</p>)}
    </> : !state.event.teamsLocked ? <form onSubmit={(event) => { event.preventDefault(); void run({ action: "team.create", name }); }} className="mt-4 flex gap-2"><input aria-label="Team name" required minLength={2} maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" className={gameInput} /><button className={gameButton} disabled={busy}><Plus className="h-4 w-4" />Create</button></form> : <p className="mt-3 text-sm text-gray-600">Ask the host to add you to a team.</p>}
    {!state.event.teamsLocked && captain && team!.members.length < 5 && <div className="mt-4"><input aria-label="Search available players" placeholder="Find a player" value={search} onChange={(event) => setSearch(event.target.value)} className={gameInput} /><ul className="mt-2 max-h-40 overflow-auto">{state.availablePlayers.filter((alias) => alias.includes(search.toLowerCase())).map((alias) => <li key={alias} className="flex items-center justify-between gap-2 py-1 text-sm"><span className="break-all">{alias}</span><button aria-label={`Add ${alias}`} title={`Add ${alias}`} disabled={busy} onClick={() => run({ action: "team.join", teamId: team!.id, alias })} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><UserPlus className="h-4 w-4" /></button></li>)}</ul></div>}
    {!team && !state.event.teamsLocked && <div className="mt-4 divide-y divide-gray-100">{state.boards.teams.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{entry.name}</p><p className="text-xs text-gray-500">{entry.members.length}/5 players</p></div><button disabled={busy || entry.members.length >= 5} onClick={() => run({ action: "team.join", teamId: entry.id })} className="text-sm font-bold text-blue-700 disabled:text-gray-400">{entry.members.length >= 5 ? "Full" : "Join"}</button></div>)}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}

export function GameLeaderboards({ state }: { state: GameState }) {
  const [board, setBoard] = useState<"individual" | "teams">("individual");
  return <section aria-label="Leaderboards">
    <div className="flex items-baseline justify-between"><h2 className="font-display text-xl font-bold">Leaderboard</h2><span className="text-xs text-gray-500">{state.boards.individual.length} players</span></div>
    <div className="mt-4 grid grid-cols-2 border-b border-gray-200" role="tablist" aria-label="Leaderboard type">{(["individual", "teams"] as const).map((tab) => <button key={tab} role="tab" aria-selected={board === tab} onClick={() => setBoard(tab)} className={`border-b-2 py-3 text-sm font-semibold ${board === tab ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500"}`}>{tab === "individual" ? "Players" : "Teams"}</button>)}</div>
    <ol className="mt-2 divide-y divide-gray-100">{board === "individual" ? state.boards.individual.map((entry) => <li key={entry.alias} title={entry.verified ? "Eligible for prizes" : "Not eligible for prizes until Benevity is approved"} className={`flex items-center gap-3 px-2 py-3 ${entry.alias === state.me?.alias ? "bg-blue-50" : ""} ${entry.verified ? "text-gray-900" : "text-gray-500"}`}><span className="w-6 shrink-0 text-sm tabular-nums">{entry.rank}</span><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-sm font-semibold"><span className="truncate">{entry.alias}</span><Verified approved={entry.verified} /></p>{entry.alias === state.me?.alias && <span className="text-xs text-blue-700">You</span>}</div><strong className="text-sm tabular-nums">{entry.points.toLocaleString()}</strong></li>) : state.boards.teams.map((entry) => <li key={entry.id} className={`flex items-center gap-3 px-2 py-3 ${entry.id === state.team?.id ? "bg-blue-50" : ""}`}><span className="w-6 text-sm tabular-nums">{entry.rank}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{entry.name}</p><p className="text-xs text-gray-500">{entry.finishedAt ? `Finished #${entry.finishPlace} · ${Math.floor((entry.elapsedSec ?? 0) / 60)}m ${(entry.elapsedSec ?? 0) % 60}s` : `Level ${entry.level} · ${entry.solvedLevels}/5 solved`}</p></div><strong className="text-sm tabular-nums">{entry.points.toLocaleString()}</strong></li>)}</ol>
    {board === "teams" && !state.boards.teams.length && <p className="py-8 text-sm text-gray-500">No teams yet.</p>}
  </section>;
}

export function VerificationForm({ state, act }: { state: GameState; act: Act }) {
  const [hours, setHours] = useState(state.verification?.hours ?? 1);
  const [note, setNote] = useState(state.verification?.note ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (["APPROVED", "SUBMITTED"].includes(state.verification?.status ?? "")) return <div className="space-y-2 text-sm"><p className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />{state.verification?.status === "APPROVED" ? "Benevity approved. You are eligible for prizes." : "Verification submitted. Awaiting host approval."}</p><p>{state.verification?.hours} hours logged</p></div>;
  return <form className="max-w-lg space-y-4" onSubmit={async (event) => { event.preventDefault(); if (busy) return; setBusy(true); setError(""); try { await act({ action: "verification", hours, note, confirmed }); } catch (failure) { setError((failure as Error).message); } finally { setBusy(false); } }}>
    {state.verification?.rejectReason && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.verification.rejectReason}</p>}
    <div className="flex flex-wrap gap-4 text-sm font-semibold text-blue-700">{state.event.givingUrl && <a href={state.event.givingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">Benevity <ExternalLink className="h-4 w-4" /></a>}{state.event.verificationFormUrl && <a href={state.event.verificationFormUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">Submit screenshot via form <ExternalLink className="h-4 w-4" /></a>}</div>
    <p className="text-sm text-gray-600">Log your hours in Benevity, then send the confirmation screenshot through the linked form using your alias <strong>{state.me?.alias}</strong>. The host reviews submissions for prize eligibility.</p>
    <label className="block text-sm font-medium">Hours logged<input type="number" min="0.25" max="24" step="0.25" required value={hours} onChange={(event) => setHours(Number(event.target.value))} className={`${gameInput} mt-1`} /></label>
    <label className="block text-sm font-medium">Note (optional)<textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} className={`${gameInput} mt-1`} /></label>
    <label className="flex items-start gap-2 text-sm"><input className="mt-1 h-4 w-4" type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I submitted my Benevity confirmation screenshot through the form.</label>
    {!state.event.verificationFormUrl && <p className="text-sm text-amber-800">The host has not configured the verification form yet.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button className={gameButton} disabled={busy || !state.event.verificationFormUrl}>{busy ? "Submitting..." : "Confirm submission"}</button>
  </form>;
}

export function VolunteerForm({ state, refresh }: { state: GameState; refresh: () => Promise<void> }) {
  const [mode, setMode] = useState(state.pledge?.mode ?? "ONLINE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return <form className="space-y-5" onSubmit={async (event) => {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    const data = { ...Object.fromEntries(fields.entries()), interests: fields.getAll("interests"), consent: fields.get("consent") === "on" };
    setBusy(true); setError(""); setMessage("");
    try { await gameFetch(`/api/games/events/${state.event.id}/volunteer`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); setMessage("Your volunteering preferences have been saved."); await refresh(); } catch (failure) { setError((failure as Error).message); } finally { setBusy(false); }
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">Name<input name="name" required maxLength={80} defaultValue={state.pledge?.name ?? ""} autoComplete="name" className={`${gameInput} mt-1`} /></label>
      <label className="text-sm font-medium">Email<input name="email" type="email" defaultValue={state.pledge?.email ?? ""} autoComplete="email" className={`${gameInput} mt-1`} /></label>
      <label className="text-sm font-medium">Phone<input name="phone" type="tel" defaultValue={state.pledge?.phone ?? ""} autoComplete="tel" className={`${gameInput} mt-1`} /></label>
      <label className="text-sm font-medium">Mode<select aria-label="Mode" name="mode" value={mode} onChange={(event) => setMode(event.target.value)} className={`${gameInput} mt-1`}><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="BOTH">Both</option></select></label>
      {mode !== "ONLINE" && <label className="text-sm font-medium">City<input name="city" required defaultValue={state.pledge?.city ?? ""} maxLength={80} className={`${gameInput} mt-1`} /></label>}
      <label className="text-sm font-medium">Availability<select name="availability" defaultValue={state.pledge?.availability ?? "FLEXIBLE"} className={`${gameInput} mt-1`}><option value="WEEKDAYS">Weekdays</option><option value="WEEKENDS">Weekends</option><option value="BOTH">Both</option><option value="FLEXIBLE">Flexible</option></select></label>
      <label className="text-sm font-medium">Hours per month<select name="hoursPerMonth" defaultValue={state.pledge?.hoursPerMonth ?? "2-5"} className={`${gameInput} mt-1`}>{["<2", "2-5", "5-10", "10+"].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <fieldset><legend className="mb-3 text-sm font-semibold">Interests</legend><div className="grid gap-3 sm:grid-cols-2">{volunteerInterests.map((interest) => <label key={interest} className="flex items-start gap-2 text-sm text-gray-700"><input type="checkbox" name="interests" value={interest} defaultChecked={state.pledge?.interests.includes(interest)} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700" />{interest}</label>)}</div></fieldset>
    <label className="block text-sm font-medium">Other<textarea name="other" maxLength={500} defaultValue={state.pledge?.other ?? ""} className={`${gameInput} mt-1`} /></label>
    <label className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required defaultChecked={state.pledge?.consent} className="mt-0.5 h-4 w-4" />Ashraya may contact me about volunteering</label>
    <p className="text-xs text-gray-500">Provide an email or phone number so Ashraya can contact you.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    <button className={gameButton} disabled={busy}>{busy ? "Saving..." : state.pledge ? "Update preferences" : "Save preferences"}</button>
  </form>;
}