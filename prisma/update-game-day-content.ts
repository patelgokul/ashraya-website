import { PrismaClient } from "@prisma/client";
import { GAME_DAY_LAYOUT, HUNT_LEVEL_POINTS, LIVE_KINDS, checkLiveRounds, contentSchema, huntSchema, privateJson, roundSettings } from "./game-day-content";

// Refreshes an already-seeded event in place: hunt cards/hints/keys, song and riddle questions, and the round layout.
// Dry run by default; pass --apply to write. Refuses to replace questions that players have already answered,
// unless --reset-play also wipes this event's rehearsal play (answers, scores, teams, screenshots, pledges, round clocks).
const database = new PrismaClient();
const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
const apply = args.includes("--apply");
const resetPlay = args.includes("--reset-play");

async function wipePlay(eventId: string) {
  const roundFilter = { question: { round: { eventId } } };
  const counts = {
    attempts: await database.gameAttempt.count({ where: roundFilter }), scores: await database.gameScore.count({ where: { eventId } }),
    teams: await database.team.count({ where: { eventId } }), verifications: await database.scoreVerification.count({ where: { eventId } }),
    pledges: await database.volunteerPledge.count({ where: { eventId } }),
  };
  if (apply) {
    await database.gameScore.updateMany({ where: { eventId }, data: { refundForId: null } });
    await database.gameScore.deleteMany({ where: { eventId } });
    await database.gameAttempt.deleteMany({ where: roundFilter });
    await database.team.deleteMany({ where: { eventId } });
    await database.scoreVerification.deleteMany({ where: { eventId } });
    await database.volunteerPledge.deleteMany({ where: { eventId } });
    await database.gameRound.updateMany({ where: { eventId }, data: { openedAt: null, closedAt: null } });
    await database.gameEvent.update({ where: { id: eventId }, data: { teamsLockedAt: null, huntDeadlineAt: null } });
  }
  return `reset play: ${Object.entries(counts).map(([name, count]) => `${count} ${name}`).join(", ")}, all round clocks`;
}

async function main() {
  if (!args.includes("--hunt") || !args.includes("--content")) throw new Error("Use --hunt <ignored JSON> --content <ignored JSON> [--apply]");
  const content = contentSchema.parse(privateJson(option("--content")));
  const hunt = huntSchema.parse(privateJson(option("--hunt")));
  checkLiveRounds(content);
  const eventId = content.eventId;
  const event = await database.gameEvent.findUnique({ where: { id: eventId }, include: { rounds: { orderBy: { order: "asc" }, include: { questions: { include: { _count: { select: { attempts: true } } } } } } } });
  if (!event) throw new Error(`Event ${eventId} not found`);
  const { titles, kinds } = GAME_DAY_LAYOUT;
  if (event.rounds.length !== kinds.length) throw new Error(`Expected ${kinds.length} rounds, found ${event.rounds.length}`);

  const changes: string[] = resetPlay ? [await wipePlay(eventId)] : [];
  let huntIndex = 0;
  for (const [index, kind] of kinds.entries()) {
    const round = event.rounds[index];
    if (round.order !== index + 1) throw new Error(`Round order gap at ${index + 1}`);
    if (kind === "HUNT_LEVEL") {
      if (round.kind !== "HUNT_LEVEL") throw new Error(`Round ${round.order} should already be a hunt level`);
      const level = hunt.levels[huntIndex];
      const maxPoints = HUNT_LEVEL_POINTS[huntIndex++];
      changes.push(`r${round.order} hunt: ${level.title}, up to ${maxPoints}`);
      if (!apply) continue;
      await database.gameRound.update({ where: { id: round.id }, data: { title: level.title, description: level.card, maxPoints } });
      await database.gameQuestion.update({ where: { id: round.questions[0].id }, data: { acceptedAnswers: [level.answer], hints: level.hints, revealOnSolve: level.revealOnSolve } });
      continue;
    }
    if (!LIVE_KINDS.includes(kind)) {
      if (round.kind !== kind) throw new Error(`Round ${round.order} should be ${kind}`);
      continue;
    }
    const answered = round.questions.reduce((sum, question) => sum + question._count.attempts, 0);
    if (answered && !resetPlay) {
      if (round.kind !== kind) throw new Error(`Round ${round.order} (${round.title}) already has ${answered} answers; not replacing it`);
      changes.push(`r${round.order} unchanged: ${answered} answers already in`);
      continue;
    }
    const custom = content.rounds.find((entry) => entry.order === round.order)!;
    const title = custom.title ?? titles[index];
    changes.push(`r${round.order} ${round.kind === kind ? kind : `${round.kind} -> ${kind}`}: ${title} (${custom.questions.length} question)`);
    if (!apply) continue;
    await database.gameRound.update({ where: { id: round.id }, data: { kind, title, description: null, ...roundSettings(kind) } });
    await database.gameQuestion.deleteMany({ where: { roundId: round.id } });
    for (const [questionIndex, question] of custom.questions.entries()) {
      await database.gameQuestion.create({ data: { id: `${round.id}-q${questionIndex + 1}`, roundId: round.id, order: questionIndex, prompt: question.prompt, mediaUrl: question.mediaUrl, acceptedAnswers: question.acceptedAnswers, matchThreshold: question.matchThreshold } });
    }
  }
  const pending = await database.scoreVerification.count({ where: { eventId, status: "SUBMITTED" } });
  changes.push(`${pending} submitted screenshot(s) to mark approved`);
  if (apply) {
    await database.gameEvent.update({ where: { id: eventId }, data: { games: titles } });
    await database.scoreVerification.updateMany({ where: { eventId, status: "SUBMITTED" }, data: { status: "APPROVED" } });
  }
  console.log(`${apply ? "Updated" : "Dry run for"} ${eventId}:\n- ${changes.join("\n- ")}${apply ? "" : "\nRe-run with --apply to write."}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());
