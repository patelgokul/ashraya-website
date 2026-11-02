"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Globe2, MessageCircle, Sparkles } from "lucide-react";
import { useGiveHamper } from "@/hooks/useGiveHamper";
import { CITY_GROUPS, TREASURE_HUNT, officeById } from "@/lib/give-hamper";

const HUNT_SEEN_KEY = "give-hamper-hunt-seen";

export function GiveHamperThanks() {
  const router = useRouter();
  const { state, error, refresh } = useGiveHamper();
  const [showWhatsapp, setShowWhatsapp] = useState(!TREASURE_HUNT.enabled);

  useEffect(() => {
    if (localStorage.getItem(HUNT_SEEN_KEY) === "true") setShowWhatsapp(true);
  }, []);
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
  const revealWhatsapp = () => {
    localStorage.setItem(HUNT_SEEN_KEY, "true");
    setShowWhatsapp(true);
  };

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

      {TREASURE_HUNT.enabled && (
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
          <a href={TREASURE_HUNT.registerUrl} target="_blank" rel="noreferrer" onClick={revealWhatsapp}
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
            Register for the Treasure Hunt
          </a>
          {!showWhatsapp && (
            <button type="button" onClick={revealWhatsapp} className="mt-3 w-full text-center text-xs font-semibold text-gray-400 hover:text-white">
              Maybe later
            </button>
          )}
        </section>
      )}

      {showWhatsapp && group && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-900"><MessageCircle className="h-5 w-5 shrink-0 text-green-600" />Join the ĀSHRAYA {group.name} community</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Join the {group.name} WhatsApp group for updates, activities, and volunteering opportunities near you.
          </p>
          {group.whatsappUrl ? (
            <a href={group.whatsappUrl} target="_blank" rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700">
              <MessageCircle className="h-4 w-4" />Join the {group.name} WhatsApp group
            </a>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600">The {group.name} group link will be shared here soon.</p>
          )}
        </section>
      )}
    </div>
  );
}
