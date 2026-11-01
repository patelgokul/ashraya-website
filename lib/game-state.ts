import { prisma } from "@/lib/prisma";
import { GameError } from "@/lib/game-auth";
import { compareRanks } from "@/lib/game-rules";
import type { GameParticipant } from "@prisma/client";

export type Hint = { text: string; penaltyPct: number; order?: number };

export async function getGameLeaderboard(eventId: string) {
  const [players, teams, totals, lastAnswers, verified] = await Promise.all([
    prisma.gameRegistration.findMany({ where: { eventId }, select: { alias: true, participant: { select: { name: true } } } }),
    prisma.team.findMany({ where: { eventId }, include: { members: { orderBy: { joinedAt: "asc" }, select: { alias: true, participant: { select: { name: true } } } }, progress: { orderBy: { unlockedAt: "asc" } } } }),
    prisma.gameScore.groupBy({ by: ["alias", "teamId"], where: { eventId, voidedAt: null }, _sum: { points: true } }),
    prisma.gameScore.groupBy({ by: ["alias", "teamId"], where: { eventId, voidedAt: null, points: { gt: 0 }, roundId: { not: null } }, _max: { createdAt: true } }),
    prisma.scoreVerification.findMany({ where: { eventId, status: "APPROVED" }, select: { alias: true } }),
  ]);
  const approved = new Set(verified.map((entry) => entry.alias));
  const individual = players.map((player) => ({
    alias: player.alias, name: player.participant.name, verified: approved.has(player.alias),
    points: totals.find((entry) => entry.alias === player.alias && !entry.teamId)?._sum.points ?? 0,
    lastAnswer: lastAnswers.find((entry) => entry.alias === player.alias && !entry.teamId)?._max.createdAt?.toISOString() ?? null,
  })).sort(compareRanks).map((entry, index) => ({ ...entry, rank: index + 1 }));
  const teamBoard = teams.map((team) => ({
    id: team.id, alias: team.name, name: team.name, captainAlias: team.captainAlias,
    members: team.members.map((member) => ({ alias: member.alias, name: member.participant.name, verified: approved.has(member.alias) })),
    points: totals.filter((entry) => entry.teamId === team.id).reduce((sum, entry) => sum + (entry._sum.points ?? 0), 0),
    lastAnswer: lastAnswers.filter((entry) => entry.teamId === team.id).map((entry) => entry._max.createdAt?.toISOString() ?? "").sort().at(-1) || null,
    level: Math.min(5, team.progress.filter((entry) => entry.solvedAt).length + 1),
    solvedLevels: team.progress.filter((entry) => entry.solvedAt).length,
    finishedAt: team.finishedAt?.toISOString() ?? null, finishPlace: team.finishPlace,
    elapsedSec: team.finishedAt && team.progress[0] ? Math.round((team.finishedAt.getTime() - team.progress[0].unlockedAt.getTime()) / 1000) : null,
  })).sort(compareRanks).map((entry, index) => ({ ...entry, rank: index + 1 }));
  return { individual, teams: teamBoard };
}

export async function getGameState(eventId: string, player: GameParticipant | null) {
  const event = await prisma.gameEvent.findUnique({ where: { id: eventId }, include: { rounds: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" } } } } } });
  if (!event) throw new GameError("Event not found", 404);
  if (player && !await prisma.gameRegistration.findUnique({ where: { eventId_alias: { eventId, alias: player.alias } } })) {
    await prisma.gameRegistration.createMany({ data: [{ eventId, alias: player.alias }], skipDuplicates: true });
  }
  const alias = player?.alias ?? "";
  const [membership, verification, pledge, boards] = await Promise.all([
    prisma.teamMember.findUnique({ where: { eventId_alias: { eventId, alias } }, include: { team: { include: { progress: true } } } }),
    prisma.scoreVerification.findUnique({ where: { eventId_alias: { eventId, alias } } }),
    prisma.volunteerPledge.findUnique({ where: { eventId_alias: { eventId, alias } } }),
    getGameLeaderboard(eventId),
  ]);
  const teamId = membership?.teamId;
  const [attempts, scores] = await Promise.all([
    prisma.gameAttempt.findMany({ where: { question: { round: { eventId } }, OR: [{ alias }, ...(teamId ? [{ teamId }] : [])] }, orderBy: { createdAt: "desc" } }),
    prisma.gameScore.findMany({ where: { eventId, OR: [{ alias, teamId: null }, ...(teamId ? [{ teamId }] : [])] } }),
  ]);
  const now = new Date();
  const isVerified = verification?.status === "SUBMITTED" || verification?.status === "APPROVED";
  const rounds = event.rounds.map((round) => {
    const hunt = round.kind === "HUNT_LEVEL";
    const progress = membership?.team.progress.find((entry) => entry.roundId === round.id);
    const earned = scores.filter((entry) => entry.roundId === round.id);
    const done = hunt ? !!progress?.solvedAt : round.kind === "VERIFY" ? isVerified : round.kind === "VOLUNTEER" ? !!pledge : round.questions.length > 0 && round.questions.every((question) => earned.some((entry) => entry.questionId === question.id));
    let lockedReason: string | null = !player ? "Sign in to join this round" : !round.openedAt ? "Starts soon" : null;
    if (hunt && round.openedAt && player) {
      if (!teamId) lockedReason = "Join a team to start the hunt";
      else if (!progress) lockedReason = "Solve the previous level first";
      else if (round.requiresVerification && !isVerified) lockedReason = "Log your hours in Benevity and upload the confirmation screenshot to unlock Level 4 and Level 5.";
    }
    const closed = (!!round.closedAt && round.closedAt <= now) || (hunt && !!event.huntDeadlineAt && event.huntDeadlineAt <= now);
    const state: "LOCKED" | "LIVE" | "DONE" | "CLOSED" = lockedReason ? "LOCKED" : done ? "DONE" : closed ? "CLOSED" : "LIVE";
    return {
      id: round.id, order: round.order, kind: round.kind, title: round.title, state, lockedReason,
      openedAt: round.openedAt?.toISOString() ?? null,
      endsAt: (hunt ? event.huntDeadlineAt : round.closedAt)?.toISOString() ?? null,
      unlockedAt: progress?.unlockedAt.toISOString() ?? null, solvedAt: progress?.solvedAt?.toISOString() ?? null,
      highestHint: progress?.highestHint ?? 0, isFinal: round.isFinal,
      maxPoints: round.maxPoints, points: earned.filter((entry) => !entry.voidedAt).reduce((sum, entry) => sum + entry.points, 0),
      description: state === "LOCKED" ? null : round.description,
      questions: state === "LOCKED" ? [] : round.questions.map((question) => {
        const ownAttempts = attempts.filter((attempt) => attempt.questionId === question.id && (hunt || attempt.alias === alias));
        const correct = ownAttempts.find((attempt) => attempt.isCorrect);
        const award = earned.find((entry) => hunt || entry.questionId === question.id);
        const hints = question.hints as Hint[];
        return {
          id: question.id, prompt: question.prompt, mediaUrl: question.mediaUrl,
          correct: hunt ? !!progress?.solvedAt : !!award,
          answer: correct?.answer ?? null, points: award && !award.voidedAt ? award.points : 0,
          elapsedSec: correct ? Math.max(0, Math.round((correct.createdAt.getTime() - (progress?.unlockedAt ?? round.openedAt ?? correct.createdAt).getTime()) / 1000)) : null,
          attemptsLeft: round.maxAttempts === null ? null : Math.max(0, round.maxAttempts - ownAttempts.length),
          revealedAnswer: !hunt && closed ? question.acceptedAnswers[0] ?? null : null,
          revealOnSolve: hunt && progress?.solvedAt ? question.revealOnSolve : null,
          hints: hunt ? hints.map((hint, index) => ({ order: index + 1, penaltyPct: hint.penaltyPct, text: index < (progress?.highestHint ?? 0) ? hint.text : null })) : [],
        };
      }),
    };
  });
  const inTeam = new Set(boards.teams.flatMap((team) => team.members.map((member) => member.alias)));
  return {
    serverNow: now.toISOString(),
    event: { id: event.id, title: event.title, company: event.company, location: event.location, eventDate: event.eventDate.toISOString(), givingUrl: event.givingUrl, verificationFormUrl: event.verificationFormUrl, teamsLocked: !!event.teamsLockedAt, huntDeadlineAt: event.huntDeadlineAt?.toISOString() ?? null },
    me: player ? { alias, name: player.name, isAdmin: player.isAdmin } : null,
    rounds, boards, team: boards.teams.find((team) => team.id === teamId) ?? null,
    availablePlayers: boards.individual.filter((entry) => !inTeam.has(entry.alias)).map((entry) => ({ alias: entry.alias, name: entry.name })),
    verification: verification ? { status: verification.status, hours: Number(verification.hours), note: verification.note, rejectReason: verification.rejectReason } : null,
    pledge: pledge ? { name: pledge.name, email: pledge.email, phone: pledge.phone, mode: pledge.mode, city: pledge.city, availability: pledge.availability, hoursPerMonth: pledge.hoursPerMonth, interests: pledge.interests, other: pledge.other, consent: pledge.consent } : null,
  };
}

export type GameState = Awaited<ReturnType<typeof getGameState>>;
export type RoundState = GameState["rounds"][number];

export async function getGameAdminState(eventId: string, scorePage = 0) {
  const [rounds, feed, scores, verifications, teams, participants, volunteers] = await Promise.all([
    prisma.gameRound.findMany({ where: { eventId }, orderBy: { order: "asc" }, include: { questions: { select: { id: true, _count: { select: { attempts: true } } } } } }),
    prisma.gameAttempt.findMany({ where: { question: { round: { eventId } } }, orderBy: { createdAt: "desc" }, take: 100, include: { question: { select: { round: { select: { title: true } } } } } }),
    prisma.gameScore.findMany({ where: { eventId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: scorePage * 200, take: 201 }),
    prisma.scoreVerification.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ where: { eventId }, include: { members: true, progress: { include: { round: { select: { title: true } } } } } }),
    prisma.gameRegistration.findMany({ where: { eventId }, select: { alias: true, participant: { select: { name: true } } } }),
    prisma.volunteerPledge.findMany({ where: { eventId }, orderBy: { updatedAt: "desc" } }),
  ]);
  return { rounds, feed, scores: scores.slice(0, 200), hasMoreScores: scores.length > 200, verifications, teams, participants, volunteers };
}

type Wire<Value> = Value extends Date ? string : Value extends { toNumber(): number } ? string : Value extends (infer Item)[] ? Wire<Item>[] : Value extends object ? { [Key in keyof Value]: Wire<Value[Key]> } : Value;
export type GameAdminState = Wire<Awaited<ReturnType<typeof getGameAdminState>>>;