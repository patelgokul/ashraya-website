"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { GAME_OPTIONS } from "@/lib/validations/game";
import { formatEventDate } from "@/lib/formatEventDate";
import type { GameEventSummary } from "@/types/games";

const inputClass =
  "w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors";

export function EventsHome() {
  const router = useRouter();
  const [events, setEvents] = useState<GameEventSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [givingUrl, setGivingUrl] = useState("");
  const [games, setGames] = useState<string[]>([...GAME_OPTIONS]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/games/events", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { events: GameEventSummary[] }) => setEvents(data.events))
      .catch(() => setEvents([]));
  }, []);

  function updateGame(index: number, value: string) {
    setGames((current) => current.map((game, i) => (i === index ? value : game)));
  }

  async function handleCreate(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/games/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        company,
        location,
        eventDate,
        givingUrl,
        games: games.map((game) => game.trim()).filter(Boolean),
      }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok || !data?.id) {
      const fieldError = data?.error?.fieldErrors
        ? Object.values<string[]>(data.error.fieldErrors).flat()[0]
        : null;
      setError(fieldError || "Couldn't create the event. Check the form and try again.");
      return;
    }
    router.push(`/games/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating((open) => !open)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> {creating ? "Close form" : "Create new event"}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-xl font-bold text-gray-900">New event</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">Event name</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ashraya Game Day" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">Company</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">Date</span>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={`${inputClass} bg-white`} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">Giving link</span>
              <input value={givingUrl} onChange={(e) => setGivingUrl(e.target.value)} placeholder="Optional giving link" className={inputClass} />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Games</span>
              <button type="button" onClick={() => setGames((current) => [...current, ""])} className="text-sm font-semibold text-blue-700">
                Add game
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {games.map((game, index) => (
                <div key={index} className="flex gap-2">
                  <input value={game} onChange={(e) => updateGame(index, e.target.value)} className={inputClass} />
                  <button
                    type="button"
                    onClick={() => setGames((current) => current.filter((_, i) => i !== index))}
                    className="rounded-xl px-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove game"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Creating..." : "Create event"}
          </button>
        </form>
      )}

      {events === null ? (
        <p className="text-center text-sm text-gray-400 py-10">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          No events yet. Create the first one.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <a key={event.id} href={`/games/${event.id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-blue-200">
              <h2 className="font-display text-xl font-bold text-gray-900">{event.title}</h2>
              <p className="mt-1 text-sm font-medium text-blue-800">{event.company}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-blue-600" /> {formatEventDate(event.eventDate)}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-orange-500" /> {event.location}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                <Users className="h-4 w-4" /> {event.participantCount} participants · {event.games.length} games
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
