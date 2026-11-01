import { PrismaClient, RoundKind } from "@prisma/client";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { z } from "zod";

const database = new PrismaClient();
const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
const demo = args.includes("--demo");
const hintSchema = z.object({ order: z.number().int().min(1).max(3).optional(), penaltyPct: z.number().min(0).max(99), text: z.string().min(1) });
const huntSchema = z.object({ levels: z.array(z.object({
  title: z.string().min(1), card: z.string().min(1), answer: z.string().regex(/^key[1-5]_[A-Za-z0-9]{15,20}_.+$/),
  hints: z.array(hintSchema).length(3), revealOnSolve: z.string(), requiresVerification: z.boolean().optional(), isFinal: z.boolean().optional(),
})).length(5) });
const questionSchema = z.object({ prompt: z.string().optional(), mediaUrl: z.string().url().optional(), acceptedAnswers: z.array(z.string().min(1)).min(1), matchThreshold: z.number().min(0.8).max(0.95).default(0.85) });
const contentSchema = z.object({
  eventId: z.string().min(1).max(80), title: z.string(), company: z.string(), location: z.string(), givingUrl: z.string().url(), verificationFormUrl: z.string().url(),
  rounds: z.array(z.object({ order: z.number().int().min(1).max(17), title: z.string().optional(), questions: z.array(questionSchema).min(1).max(10) })),
});

function privateJson(path: string) {
  const absolute = resolve(path);
  try { execFileSync("git", ["check-ignore", "--quiet", absolute]); } catch { throw new Error("Private seeds must be gitignored and untracked"); }
  return JSON.parse(readFileSync(absolute, "utf8"));
}

async function main() {
  if (demo && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error("Demo seed is restricted to a local database");
  if (!demo && (!args.includes("--hunt") || !args.includes("--content"))) throw new Error("Use --demo, or --hunt <ignored JSON> --content <ignored JSON>");
  const content = demo ? null : contentSchema.parse(privateJson(option("--content")));
  const hunt = demo ? null : huntSchema.parse(privateJson(option("--hunt")));
  const eventId = demo ? "game-day-rehearsal" : content!.eventId;
  if (await database.gameEvent.findUnique({ where: { id: eventId } })) throw new Error("Event already exists. Seed a new event ID; existing play data is never overwritten.");
  const titles = ["Guess the Song 1", "Guess the Riddle 1", "Treasure Hunt - Level 1", "Treasure Hunt - Level 2", "Treasure Hunt - Level 3", "Verify your score", "Treasure Hunt - Level 4", "Treasure Hunt - Level 5", "Guess the Song 2", "Guess the Riddle 2", "Guess the Song 3", "Guess the Riddle 3", "Scribble 1", "Guess the Song 4", "Guess the Song 5", "Emoji Movie", "Volunteering"];
  const kinds: RoundKind[] = ["SONG", "RIDDLE", "HUNT_LEVEL", "HUNT_LEVEL", "HUNT_LEVEL", "VERIFY", "HUNT_LEVEL", "HUNT_LEVEL", "SONG", "RIDDLE", "SONG", "RIDDLE", "SCRIBBLE", "SONG", "SONG", "SCRIBBLE", "VOLUNTEER"];
  const words = ["lets", "change", "one", "persons", "world"];
  const liveOrders = kinds.flatMap((kind, index) => ["SONG", "RIDDLE", "SCRIBBLE"].includes(kind) ? [index + 1] : []);
  if (content) {
    for (const order of liveOrders) {
      const round = content.rounds.find((entry) => entry.order === order);
      if (!round || round.questions.length !== (kinds[order - 1] === "SCRIBBLE" ? 10 : 1)) throw new Error(`Round ${order} needs ${kinds[order - 1] === "SCRIBBLE" ? 10 : 1} questions`);
    }
  }
  await database.gameEvent.create({ data: {
    id: eventId, title: demo ? "Ashraya Game Day - Rehearsal" : content!.title, company: content?.company ?? "Ashraya",
    location: content?.location ?? "Online", eventDate: new Date("2026-11-04T00:00:00Z"), games: titles,
    givingUrl: content?.givingUrl ?? "https://benevity.com/", verificationFormUrl: content?.verificationFormUrl ?? "https://forms.google.com/",
  } });
  let huntIndex = 0;
  for (const [index, kind] of kinds.entries()) {
    const levelIndex = huntIndex;
    const level = kind === "HUNT_LEVEL" ? hunt?.levels[huntIndex++] : undefined;
    if (kind === "HUNT_LEVEL" && demo) huntIndex++;
    const custom = content?.rounds.find((entry) => entry.order === index + 1);
    const round = await database.gameRound.create({ data: {
      id: `${eventId}-r${index + 1}`, eventId, order: index + 1, title: level?.title ?? custom?.title ?? titles[index], kind,
      maxPoints: kind === "SCRIBBLE" ? 200 : 1000, graceSec: kind === "HUNT_LEVEL" ? 30 : kind === "SCRIBBLE" ? 5 : 3,
      halfLifeSec: kind === "HUNT_LEVEL" ? 240 : kind === "SCRIBBLE" ? 60 : 20, floorPct: 30,
      durationSec: kind === "SCRIBBLE" ? 180 : ["SONG", "RIDDLE"].includes(kind) ? 90 : null,
      maxAttempts: ["SONG", "RIDDLE", "SCRIBBLE"].includes(kind) ? 3 : null,
      requiresVerification: kind === "HUNT_LEVEL" && levelIndex >= 3, isFinal: kind === "HUNT_LEVEL" && levelIndex === 4,
      openedAt: kind === "VERIFY" ? new Date() : null,
      description: kind === "HUNT_LEVEL" ? level?.card ?? `Rehearsal checkpoint ${levelIndex + 1}. The organizer's external puzzle link will appear here in the event.` : null,
    } });
    if (kind === "HUNT_LEVEL") {
      await database.gameQuestion.create({ data: {
        id: `${round.id}-q1`, roundId: round.id, acceptedAnswers: [level?.answer ?? `key${levelIndex + 1}_DemoOnlyToken00001_${words[levelIndex]}`],
        prompt: "Enter this level's key", hints: level?.hints ?? [20, 50, 80].map((penaltyPct, hintIndex) => ({ order: hintIndex + 1, penaltyPct, text: `Rehearsal hint ${hintIndex + 1}. This is demonstration content, not an event puzzle.` })),
        revealOnSolve: level?.revealOnSolve ?? (levelIndex === 4 ? "Let's change one Person's World" : "Checkpoint complete. Continue with the next rehearsal level."),
      } });
    } else if (["SONG", "RIDDLE", "SCRIBBLE"].includes(kind)) {
      const questions = custom?.questions ?? Array.from({ length: kind === "SCRIBBLE" ? 10 : 1 }, (_, questionIndex) => ({
        prompt: kind === "SONG" ? "Which movie is this song from?" : kind === "RIDDLE" ? "What shines in the night sky?" : `Picture ${questionIndex + 1}: name the object`,
        mediaUrl: kind === "SCRIBBLE" ? `/images/game-day-demo/${questionIndex + 1}.svg` : undefined,
        acceptedAnswers: kind === "SONG" ? ["3 idiots", "three idiots"] : kind === "RIDDLE" ? ["moon", "chaand", "chand"] : [["sun"], ["tree"], ["house"], ["book"], ["star"], ["clock"], ["heart"], ["cloud"], ["umbrella"], ["flower"]][questionIndex],
        matchThreshold: 0.85,
      }));
      for (const [questionIndex, question] of questions.entries()) {
        await database.gameQuestion.create({ data: { id: `${round.id}-q${questionIndex + 1}`, roundId: round.id, order: questionIndex, prompt: question.prompt, mediaUrl: question.mediaUrl, acceptedAnswers: question.acceptedAnswers, matchThreshold: question.matchThreshold } });
      }
    }
  }
  if (demo) {
    await database.gameParticipant.upsert({ where: { alias: "rehearsal_host" }, create: { alias: "rehearsal_host", name: "Rehearsal Host", isAdmin: true }, update: {} });
    for (const alias of ["maya_blr", "arjun_pune", "isha_delhi", "neel_mum"]) {
      await database.gameParticipant.upsert({ where: { alias }, create: { alias, name: alias }, update: {} });
      await database.gameRegistration.createMany({ data: [{ eventId, alias }], skipDuplicates: true });
    }
    await database.$queryRaw`SELECT game_day_command(${eventId}, 'maya_blr', 'team.create', '{"name":"Team Udaan"}'::jsonb)`;
    await database.$queryRaw`SELECT game_day_command(${eventId}, 'neel_mum', 'team.create', '{"name":"Team Umang"}'::jsonb)`;
  }
  console.log(`Seeded ${eventId}: 17 rounds. No private answer content printed.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());