import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/formatEventDate";
import { GameDay } from "@/components/games/GameDay";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { eventId: string } }): Promise<Metadata> {
  const event = await prisma.gameEvent.findUnique({ where: { id: params.eventId }, select: { title: true, location: true } });
  if (!event) return { title: "Event" };
  return { title: `${event.title} — Live Leaderboard`, description: `${event.title} at ${event.location}` };
}

export default async function GameEventPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.gameEvent.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const eventDate = event.eventDate.toISOString().slice(0, 10);

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
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatEventDate(eventDate)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>
            <span>{event.company}</span>
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <GameDay
          event={{
            id: event.id,
            title: event.title,
            company: event.company,
            location: event.location,
            eventDate,
            games: event.games,
            givingUrl: event.givingUrl,
          }}
        />
      </div>
    </div>
  );
}
