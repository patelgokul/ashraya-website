"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { formatEventDate } from "@/lib/formatEventDate";
import type { GameEventSummary } from "@/types/games";
import { GameDay } from "./GameDay";

export function GameEventScreen({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<GameEventSummary | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/games/events", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { events: GameEventSummary[] }) => {
        setEvent(data.events.find((item) => item.id === eventId) ?? null);
      })
      .catch(() => setEvent(null));
  }, [eventId]);

  if (event === undefined) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900">Event not found</h1>
        <Link href="/games" className="mt-4 inline-block text-sm font-semibold text-blue-700">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-orange-500" />
            </span>
            Live
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">{event.title}</h1>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-300">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatEventDate(event.eventDate)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>
            <span>{event.company}</span>
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <GameDay event={event} />
      </div>
    </div>
  );
}
