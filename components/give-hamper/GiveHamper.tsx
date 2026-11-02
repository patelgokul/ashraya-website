"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, CheckCircle2, Clock3, ExternalLink, Gift, LogOut, MapPin, Paintbrush } from "lucide-react";
import { useGiveHamper } from "@/hooks/useGiveHamper";
import { GIVE_HAMPER, OFFICE_LOCATIONS, type GiveHamperState } from "@/lib/give-hamper";
import { GiveHamperSchema, MAX_HAMPER_HOURS } from "@/lib/validations/give-hamper";
import { RegisterCard } from "@/components/games/RegisterCard";
import { CopyLink } from "./CopyLink";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm";

const REGISTER_INTRO = {
  register: "Register with your Microsoft alias to accept your Give Hamper. You only do this once.",
  login: "Enter the Microsoft alias you registered with to see your Give Hamper.",
};

export function GiveHamper() {
  const { state, error, refresh } = useGiveHamper();

  if (!state) {
    return (
      <div className="py-20 text-center text-sm text-gray-600" role="status">
        <Clock3 className="mx-auto mb-3 h-6 w-6 text-blue-700" />
        {error ?? "Loading your Give Hamper..."}
        {error && <button onClick={refresh} className="ml-2 font-semibold text-blue-700 underline">Retry</button>}
      </div>
    );
  }

  if (!state.me) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Your Give Hamper" className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/70 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <KitStory brief />
          <RegisterCard company="Microsoft" intro={REGISTER_INTRO} onRegistered={refresh} />
          <p className="pb-6 text-center">
            <Link href="/" className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline">Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <KitStory />
      <AcceptanceForm state={state} onLoggedOut={refresh} />
    </>
  );
}

function KitStory({ brief = false }: { brief?: boolean }) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Your little kit. A big difference.</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">This hamper is a gift you make</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Inside is a Diwali volunteering kit. You paint and decorate each piece, and ĀSHRAYA shares your finished creations with children and communities. Your creativity and the time you give are what bring the smiles.
        </p>
        <p className="mt-2 text-sm font-semibold text-gray-900">Create with love, give with joy.</p>
      </div>
      {brief ? null : <>

      <a href={GIVE_HAMPER.kitPdf} target="_blank" rel="noreferrer" className="block rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <img src={GIVE_HAMPER.kitImage} alt="ĀSHRAYA × Microsoft Diwali volunteering kit card, with the contents, painting steps, and collection dates" className="w-full rounded-xl" />
        <span className="mt-3 inline-flex items-center gap-1.5 px-1 text-sm font-semibold text-blue-700">
          Open the kit card <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </a>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <Paintbrush className="h-5 w-5 text-orange-500" />
          <h3 className="mt-2 text-sm font-bold text-gray-900">What you receive</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">Terracotta diyas and a gullak, plus a canvas, key chain, Diwali card, bag, paints, and brushes.</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <Clock3 className="h-5 w-5 text-blue-700" />
          <h3 className="mt-2 text-sm font-bold text-gray-900">How to prepare</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">Soak the diyas and gullak for 30 minutes, then dry them for about 6 hours before painting. Paint the other pieces directly.</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <CalendarRange className="h-5 w-5 text-emerald-700" />
          <h3 className="mt-2 text-sm font-bold text-gray-900">Bring them back</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">Collection drive: Wednesday 4 November to Friday 6 November 2026, at your ĀSHRAYA collection point.</p>
        </article>
      </div>
      </>}
    </section>
  );
}

function AcceptanceForm({ state, onLoggedOut }: { state: GiveHamperState; onLoggedOut: () => Promise<void> }) {
  const router = useRouter();
  const me = state.me!;
  const hamper = state.hamper;
  const [officeLocation, setOfficeLocation] = useState<string>(hamper?.officeLocation ?? "");
  const [hours, setHours] = useState(hamper ? String(hamper.hoursTracked) : "");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const returning = !!hamper;

  useEffect(() => { router.prefetch("/give-hampers/thank-you"); }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setServerError("");
    const parsed = GiveHamperSchema.safeParse({ officeLocation, hoursTracked: hours, phone: me.phone ? undefined : phone });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/give-hamper", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not submit. Please try again.");
      router.push("/give-hampers/thank-you");
    } catch (failure) {
      setServerError((failure as Error).message);
      setBusy(false);
    }
  }

  async function logOut() {
    await fetch("/api/games/register", { method: "DELETE" }).catch(() => null);
    await onLoggedOut();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
      {returning && (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          You accepted your Give Hamper on {new Date(hamper.acceptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Update your volunteering hours below.
        </p>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-gray-900">Your details</h2>
            <p className="mt-1 break-words text-sm text-gray-600">{me.name} · <span className="font-mono">{me.alias}</span>{me.phone && ` · ${me.phone}`}</p>
          </div>
          <button type="button" onClick={logOut} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900">
            <LogOut className="h-3.5 w-3.5" />Not you?
          </button>
        </div>

        {!me.phone && (
          <div className="mt-5">
            <label htmlFor="hamper-phone" className="mb-1.5 block text-sm font-medium text-gray-700">Mobile number (preferably WhatsApp)</label>
            <input id="hamper-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel" className={inputClass} />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="hamper-office" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"><MapPin className="h-4 w-4 text-blue-700" />Office location</label>
          <select id="hamper-office" value={officeLocation} onChange={(event) => setOfficeLocation(event.target.value)} className={inputClass}>
            <option value="" disabled>Select your office</option>
            {OFFICE_LOCATIONS.map((office) => <option key={office.id} value={office.id}>{office.label}</option>)}
          </select>
          {fieldErrors.officeLocation && <p className="mt-1 text-xs text-red-500">{fieldErrors.officeLocation}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-900"><Clock3 className="h-5 w-5 text-blue-700" />Track your time</h2>
        <p className="mt-1 text-sm text-gray-600">Soaking, drying, and painting all count. Log that volunteering time in Benevity, then enter your total hours here.</p>

        <a href={GIVE_HAMPER.benevityTimeUrl} target="_blank" rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-800">
          Track your time on Benevity <ExternalLink className="h-4 w-4" />
        </a>

        <p className="mb-2 mt-5 text-sm text-gray-600">Link not opening? Copy it and open it in Microsoft Edge.</p>
        <CopyLink url={GIVE_HAMPER.benevityTimeUrl} />

        <div className="mt-3">
          <label htmlFor="hamper-hours" className="mb-1.5 block text-sm font-medium text-gray-700">How many volunteering hours have you tracked?</label>
          <input id="hamper-hours" type="number" inputMode="decimal" min={0} max={MAX_HAMPER_HOURS} step={0.25} value={hours} onChange={(event) => setHours(event.target.value)} placeholder="e.g. 15" className={inputClass} />
          {fieldErrors.hoursTracked && <p className="mt-1 text-xs text-red-500">{fieldErrors.hoursTracked}</p>}
          <p className="mt-1.5 text-xs text-gray-500">You can come back later with your alias to update this.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-center sm:p-6">
        <Gift className="mx-auto h-7 w-7 text-orange-500" />
        <p className="mt-2 font-display text-lg font-bold text-gray-900">Thanks for accepting this Give Hamper!</p>
        {serverError && <p role="alert" className="mt-3 text-sm text-red-600">{serverError}</p>}
        <button type="submit" disabled={busy}
          className="mt-4 w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60">
          {busy ? "Submitting..." : returning ? "Update my hours" : "Submit"}
        </button>
      </section>
    </form>
  );
}
