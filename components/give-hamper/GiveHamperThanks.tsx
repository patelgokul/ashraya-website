"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, MessageCircle } from "lucide-react";
import { useGiveHamper } from "@/hooks/useGiveHamper";
import { CITY_GROUPS, officeById } from "@/lib/give-hamper";

export function GiveHamperThanks() {
  const router = useRouter();
  const { state, error, refresh } = useGiveHamper();

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

  const office = state.me?.officeLocation ? officeById(state.me.officeLocation) : null;
  const group = office ? CITY_GROUPS[office.city] : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
        <h2 className="mt-2 font-display text-2xl font-bold text-gray-900">Thanks for accepting this Give Hamper!</h2>
        <p className="mt-2 text-sm text-emerald-900">
          {state.me?.name}, your Give Hamper is confirmed{office && <> from {office.label}</>}.
        </p>
      </section>

      {group && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-900"><MessageCircle className="h-5 w-5 shrink-0 text-green-600" />Join the ĀSHRAYA {group.name} Volunteers group</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Join the ĀSHRAYA {group.name} Volunteers group for updates, activities, and volunteering opportunities near you.
          </p>
          <a href={group.whatsappUrl} target="_blank" rel="noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700">
            <MessageCircle className="h-4 w-4" />Join the ĀSHRAYA {group.name} Volunteers group
          </a>
        </section>
      )}

    </div>
  );
}
