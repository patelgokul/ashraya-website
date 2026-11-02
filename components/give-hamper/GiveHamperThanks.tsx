"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, CheckCircle2, Clock3, Globe2, MessageCircle, Sparkles } from "lucide-react";
import { useGiveHamper } from "@/hooks/useGiveHamper";
import { CITY_GROUPS, TREASURE_HUNT, officeById, type GiveHamperState } from "@/lib/give-hamper";

export function GiveHamperThanks() {
  const router = useRouter();
  const { state, setState, error, refresh } = useGiveHamper();

  useEffect(() => {
    if (state && !state.hamper) router.replace("/give-hampers");
  }, [state, router]);

  if (!state?.hamper) {
    return (
      <div className="py-20 text-center text-sm text-gray-600" role="status">
        <Clock3 className="mx-auto mb-3 h-6 w-6 text-blue-700" />
        {error ?? "Loading..."}
        {error && <button onClick={refresh} className="ml-2 font-semibold text-blue-700 underline">Retry</button>}
      </div>
    );
  }

  const office = officeById(state.hamper.officeLocation);
  const group = office ? CITY_GROUPS[office.city] : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
        <h2 className="mt-2 font-display text-2xl font-bold text-gray-900">Thanks for accepting this Give Hamper!</h2>
        <p className="mt-2 text-sm text-emerald-900">
          {state.me?.name}, you have tracked <strong>{state.hamper.hoursTracked} {state.hamper.hoursTracked === 1 ? "hour" : "hours"}</strong>
          {office && <> from {office.label}</>}.
        </p>
        <Link href="/give-hampers" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">Update my volunteering hours</Link>
      </section>

      {group && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-900"><MessageCircle className="h-5 w-5 shrink-0 text-green-600" />Join the ĀSHRAYA {group.name} community</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Join the {group.name} WhatsApp group for updates, activities, and volunteering opportunities near you.
          </p>
          <a href={group.whatsappUrl} target="_blank" rel="noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700">
            <MessageCircle className="h-4 w-4" />Join the {group.name} WhatsApp group
          </a>
        </section>
      )}

      {TREASURE_HUNT.enabled && <TreasureHunt registeredAt={state.hamper.treasureHuntAt} onRegistered={setState} />}
    </div>
  );
}

function TreasureHunt({ registeredAt, onRegistered }: { registeredAt: string | null; onRegistered: (state: GiveHamperState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function register() {
    if (busy || registeredAt) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/give-hamper", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not register. Please try again.");
      onRegistered(body as GiveHamperState);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-300"><Sparkles className="h-4 w-4" />Something exciting is coming!</p>
      <h2 className="mt-2 font-display text-2xl font-bold">ĀSHRAYA Give Month – Treasure Hunt</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        Join us this Wednesday for a fun-filled Treasure Hunt Game, open to Microsoft employees across locations!
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-orange-300" /><dt className="sr-only">Participation</dt><dd>Pan-Microsoft</dd></div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-300" /><dt className="sr-only">Date</dt><dd>{TREASURE_HUNT.date}</dd></div>
        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-300" /><dt className="sr-only">Time</dt><dd>{TREASURE_HUNT.time}</dd></div>
      </dl>

      <button type="button" role="checkbox" aria-checked={!!registeredAt} onClick={register} disabled={busy || !!registeredAt}
        className={`mt-5 flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition-colors ${registeredAt ? "border-emerald-400 bg-emerald-500/15" : "border-orange-400 bg-orange-500/10 hover:bg-orange-500/20"}`}>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${registeredAt ? "border-emerald-400 bg-emerald-500" : "border-orange-300"}`}>
          {registeredAt && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        </span>
        {busy ? "Registering..." : "Register me for the Treasure Hunt"}
      </button>
      {registeredAt && (
        <p role="status" className="mt-3 flex items-start gap-2 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Registration successful! You&apos;ll be invited for the event.
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}
