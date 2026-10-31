import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GameBoardResponse, GameEventSummary, LeaderboardEntry } from "@/types/games";

const COOKIE_NAME = "ashraya_game_alias";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

export function normalizeAlias(alias: string) {
  return alias.trim().toLowerCase();
}

export function setAliasCookie(res: NextResponse, alias: string) {
  res.cookies.set(COOKIE_NAME, alias, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAliasCookie(res: NextResponse) {
  res.cookies.delete(COOKIE_NAME);
}

export async function getCurrentParticipant() {
  const alias = cookies().get(COOKIE_NAME)?.value;
  if (!alias) return null;
  return prisma.gameParticipant.findUnique({ where: { alias } });
}

function rankEntries(entries: Omit<LeaderboardEntry, "rank">[]): LeaderboardEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)
  );
  return sorted.reduce<LeaderboardEntry[]>((ranked, entry, index) => {
    const previous = ranked[index - 1];
    const rank = previous?.totalPoints === entry.totalPoints ? previous.rank : index + 1;
    return [...ranked, { ...entry, rank }];
  }, []);
}

export async function listGameEvents(): Promise<GameEventSummary[]> {
  const [events, players, registrations] = await Promise.all([
    prisma.gameEvent.findMany({ orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }] }),
    prisma.gameScore.groupBy({ by: ["eventId", "alias"] }),
    prisma.gameRegistration.findMany({ select: { eventId: true, alias: true } }),
  ]);

  const attendees = new Map<string, Set<string>>();
  for (const { eventId, alias } of [...players, ...registrations]) {
    if (!attendees.has(eventId)) attendees.set(eventId, new Set());
    attendees.get(eventId)!.add(alias);
  }

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    company: event.company,
    location: event.location,
    eventDate: event.eventDate.toISOString().slice(0, 10),
    games: event.games,
    givingUrl: event.givingUrl,
    participantCount: attendees.get(event.id)?.size ?? 0,
  }));
}

export async function getGameBoard(
  eventId: string,
  me: { alias: string; name: string } | null
): Promise<GameBoardResponse | null> {
  const event = await prisma.gameEvent.findUnique({ where: { id: eventId } });
  if (!event) return null;

  const [totals, recent, myScores] = await Promise.all([
    prisma.gameScore.groupBy({
      by: ["alias"],
      where: { eventId, teamId: null, voidedAt: null },
      _sum: { points: true },
      _count: true,
    }),
    prisma.gameScore.findMany({
      where: { eventId, teamId: null, voidedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, game: true, points: true, createdAt: true, participant: { select: { name: true } } },
    }),
    me
      ? prisma.gameScore.findMany({
          where: { eventId, alias: me.alias, teamId: null, voidedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, game: true, points: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const aliases = new Set(totals.map((total) => total.alias));
  if (me) aliases.add(me.alias);
  const participants = await prisma.gameParticipant.findMany({
    where: { alias: { in: Array.from(aliases) } },
    select: { alias: true, name: true },
  });

  const totalsByAlias = new Map(totals.map((total) => [total.alias, total]));
  const leaderboard = rankEntries(
    participants.map((participant) => ({
      alias: participant.alias,
      name: participant.name,
      totalPoints: totalsByAlias.get(participant.alias)?._sum.points ?? 0,
      entries: totalsByAlias.get(participant.alias)?._count ?? 0,
    }))
  );

  return {
    me: me
      ? {
          alias: me.alias,
          name: me.name,
          scores: myScores.map((score) => ({ ...score, createdAt: score.createdAt.toISOString() })),
        }
      : null,
    leaderboard,
    recent: recent.map((score) => ({
      id: score.id,
      participantName: score.participant.name,
      game: score.game,
      points: score.points,
      createdAt: score.createdAt.toISOString(),
    })),
    games: event.games,
  };
}
