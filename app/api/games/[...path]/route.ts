import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/games";
import { ADMIN_COOKIE, GameError, checkOrigin, constantEqual, gameCommand, gameResponse, gameRoute, requireGameAdmin, requirePlayer, setAdminSession } from "@/lib/game-auth";
import { getGameAdminState, getGameLeaderboard, getGameState } from "@/lib/game-state";
import { adminActionSchema, playerActionSchema, volunteerSchema } from "@/lib/validations/game-day";
import { csvCell, matchAnswer, matchHuntKey } from "@/lib/game-rules";

export const dynamic = "force-dynamic";
type Context = { params: { path: string[] } };

async function body(request: Request) {
  if (Number(request.headers.get("content-length")) > 16000) throw new GameError("Request too large", 413);
  const text = await request.text();
  if (text.length > 16000) throw new GameError("Request too large", 413);
  try { return JSON.parse(text); } catch { throw new GameError("Invalid JSON"); }
}

export async function GET(request: NextRequest, { params }: Context) {
  return gameRoute(async () => {
    const [scope, eventId, resource] = params.path;
    if (scope !== "events" || params.path.length !== 3) throw new GameError("Not found", 404);
    if (resource === "state") return gameResponse(await getGameState(eventId, await getCurrentParticipant()));
    await requirePlayer();
    if (resource === "leaderboard") return gameResponse(await getGameLeaderboard(eventId));
    await requireGameAdmin();
    if (resource === "admin") {
      const scorePage = z.coerce.number().int().min(0).max(10000).parse(request.nextUrl.searchParams.get("scorePage") ?? 0);
      return gameResponse(await getGameAdminState(eventId, scorePage));
    }
    if (resource === "volunteers.csv") {
      const entries = await prisma.volunteerPledge.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
      const keys = ["alias", "name", "email", "phone", "mode", "city", "availability", "hoursPerMonth", "interests", "other", "consent"] as const;
      await prisma.gameAudit.create({ data: { eventId, actor: (await requireGameAdmin()).alias, action: "volunteer.export", detail: { count: entries.length } } });
      const csv = [keys.join(","), ...entries.map((entry) => keys.map((key) => csvCell(Array.isArray(entry[key]) ? (entry[key] as string[]).join("; ") : entry[key])).join(","))].join("\r\n");
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="volunteers.csv"', "Cache-Control": "private, no-store" } });
    }
    throw new GameError("Not found", 404);
  });
}

export async function POST(request: NextRequest, { params }: Context) {
  return gameRoute(async () => {
    checkOrigin(request);
    const [scope, eventId, resource] = params.path;
    const player = await requirePlayer();
    if (scope === "admin" && eventId === "pin" && params.path.length === 2) {
      if (!player.isAdmin) throw new GameError("This alias is not an administrator", 403);
      const { pin } = z.object({ pin: z.string().min(1).max(128) }).parse(await body(request));
      const expected = process.env.GAME_ADMIN_PIN;
      if (!expected || expected.length < 6) throw new GameError("Admin PIN is not configured", 503);
      const attempts = await prisma.$queryRaw<{ failures: number }[]>`
        INSERT INTO "GamePinAttempt" (alias, failures, "windowAt") VALUES (${player.alias}, 1, NOW())
        ON CONFLICT (alias) DO UPDATE SET failures = CASE WHEN "GamePinAttempt"."windowAt" < NOW() - interval '15 minutes' THEN 1 ELSE "GamePinAttempt".failures + 1 END,
        "windowAt" = CASE WHEN "GamePinAttempt"."windowAt" < NOW() - interval '15 minutes' THEN NOW() ELSE "GamePinAttempt"."windowAt" END RETURNING failures`;
      if (attempts[0].failures > 5) throw new GameError("Too many PIN attempts. Try again in 15 minutes.", 429);
      if (!constantEqual(pin, expected)) throw new GameError("Incorrect PIN", 403);
      await prisma.gamePinAttempt.deleteMany({ where: { alias: player.alias } });
      const response = gameResponse({ ok: true });
      setAdminSession(response, player.alias);
      await prisma.gameAudit.create({ data: { actor: player.alias, action: "admin.login", detail: {} } });
      return response;
    }
    if (scope !== "events" || params.path.length !== 3) throw new GameError("Not found", 404);
    if (resource === "admin") {
      await requireGameAdmin();
      const action = adminActionSchema.parse(await body(request));
      if (action.action === "admin.score.award" && !action.alias && !action.teamId) throw new GameError("Select a player or team");
      return gameResponse(await gameCommand(eventId, player.alias, action.action, action));
    }
    if (resource !== "action") throw new GameError("Not found", 404);
    if (!await prisma.gameRegistration.findUnique({ where: { eventId_alias: { eventId, alias: player.alias } } })) throw new GameError("Open this event before playing");
    const action = playerActionSchema.parse(await body(request));
    if (action.action === "verification") {
      const event = await prisma.gameEvent.findUniqueOrThrow({ where: { id: eventId } });
      if (!event.verificationFormUrl) throw new GameError("The organizer has not configured the verification form yet", 503);
      const data = { hours: action.hours, note: action.note, status: "SUBMITTED" as const, rejectReason: null, reviewedBy: null, reviewedAt: null };
      await prisma.$executeRaw`
        INSERT INTO "ScoreVerification" (id, "eventId", alias, hours, note, status) VALUES (${crypto.randomUUID()}, ${eventId}, ${player.alias}, ${data.hours}, ${data.note ?? null}, 'SUBMITTED')
        ON CONFLICT ("eventId", alias) DO UPDATE SET hours = EXCLUDED.hours, note = EXCLUDED.note, status = 'SUBMITTED', "rejectReason" = NULL, "reviewedBy" = NULL, "reviewedAt" = NULL
        WHERE "ScoreVerification".status <> 'APPROVED'`;
      return gameResponse({ ok: true });
    }
    if (action.action === "answer") {
      const question = await prisma.gameQuestion.findUnique({ where: { id: action.questionId }, include: { round: true } });
      if (!question || question.round.eventId !== eventId) throw new GameError("Question not found", 404);
      const matched = question.round.kind === "HUNT_LEVEL"
        ? { correct: question.acceptedAnswers.some((answer) => matchHuntKey(action.answer, answer)), similarity: 0, closeCall: false }
        : matchAnswer(action.answer, question.acceptedAnswers, question.matchThreshold);
      if (question.round.kind === "HUNT_LEVEL") matched.similarity = Number(matched.correct);
      const result = await gameCommand(eventId, player.alias, "answer", { ...action, ...matched });
      const submittedLevel = action.answer.trim().replace(/^["'`]+/, "").match(/^key(\d+)_/i)?.[1];
      const expectedLevel = question.acceptedAnswers[0]?.match(/^key(\d+)_/i)?.[1];
      return gameResponse({ ...result, closeCall: matched.closeCall, message: !result.correct && submittedLevel && expectedLevel && submittedLevel !== expectedLevel ? `That looks like a Level ${submittedLevel} key` : null });
    }
    return gameResponse(await gameCommand(eventId, player.alias, action.action, action));
  });
}

export async function PUT(request: NextRequest, { params }: Context) {
  return gameRoute(async () => {
    checkOrigin(request);
    const [scope, eventId, resource] = params.path;
    if (scope !== "events" || resource !== "volunteer" || params.path.length !== 3) throw new GameError("Not found", 404);
    const player = await requirePlayer();
    const round = await prisma.gameRound.findFirst({ where: { eventId, kind: "VOLUNTEER", openedAt: { not: null } } });
    if (!round || (round.closedAt && round.closedAt <= new Date())) throw new GameError("The volunteering form is not open yet");
    const data = volunteerSchema.parse(await body(request));
    const pledge = await prisma.volunteerPledge.upsert({ where: { eventId_alias: { eventId, alias: player.alias } },
      create: { ...data, eventId, alias: player.alias, name: data.name, mode: data.mode, availability: data.availability, hoursPerMonth: data.hoursPerMonth, interests: data.interests, consent: data.consent }, update: data });
    return gameResponse({ ok: true, id: pledge.id });
  });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  return gameRoute(async () => {
    checkOrigin(request);
    if (params.path.join("/") !== "admin/pin") throw new GameError("Not found", 404);
    const response = gameResponse({ ok: true });
    response.cookies.delete(ADMIN_COOKIE);
    return response;
  });
}