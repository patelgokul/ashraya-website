import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GameBoardResponse, LeaderboardEntry } from "@/types/games";

const COOKIE_NAME = "ashraya_game_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

export function createDeviceToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function setDeviceCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function getCurrentParticipant() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.gameParticipant.findUnique({ where: { tokenHash: hashToken(token) } });
}

export async function resolveGameName(game: string) {
  const existing = await prisma.gameScore.findFirst({
    where: { game: { equals: game, mode: "insensitive" } },
    select: { game: true },
  });
  return existing?.game ?? game;
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

export async function getGameBoard(participantId: string | null): Promise<GameBoardResponse> {
  const [participants, totals, recent, games, myScores] = await Promise.all([
    prisma.gameParticipant.findMany({ select: { id: true, name: true, alias: true } }),
    prisma.gameScore.groupBy({ by: ["participantId"], _sum: { points: true }, _count: true }),
    prisma.gameScore.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, game: true, points: true, createdAt: true, participant: { select: { name: true } } },
    }),
    prisma.gameScore.findMany({ distinct: ["game"], select: { game: true }, orderBy: { game: "asc" }, take: 100 }),
    participantId
      ? prisma.gameScore.findMany({
          where: { participantId },
          orderBy: { createdAt: "desc" },
          select: { id: true, game: true, points: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const totalsById = new Map(totals.map((t) => [t.participantId, t]));
  const leaderboard = rankEntries(
    participants.map((p) => ({
      id: p.id,
      name: p.name,
      alias: p.alias,
      totalPoints: totalsById.get(p.id)?._sum.points ?? 0,
      entries: totalsById.get(p.id)?._count ?? 0,
    }))
  );

  const meEntry = participantId ? participants.find((p) => p.id === participantId) : undefined;

  return {
    me: meEntry
      ? {
          id: meEntry.id,
          name: meEntry.name,
          scores: myScores.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
        }
      : null,
    leaderboard,
    recent: recent.map((s) => ({
      id: s.id,
      participantName: s.participant.name,
      game: s.game,
      points: s.points,
      createdAt: s.createdAt.toISOString(),
    })),
    games: games.map((g) => g.game),
  };
}
