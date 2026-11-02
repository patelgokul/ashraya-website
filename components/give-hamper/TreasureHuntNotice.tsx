import { CalendarDays, CheckCircle2, Clock3, Globe2, Sparkles } from "lucide-react";
import { TREASURE_HUNT } from "@/lib/give-hamper";

export function TreasureHuntNotice() {
  if (!TREASURE_HUNT.enabled) return null;
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
      <p className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <span>You&apos;re automatically signed up, so there&apos;s nothing to register. The Microsoft business admin organising the hunt will send you the invite.</span>
      </p>
    </section>
  );
}
