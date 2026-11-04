import { PrismaClient } from "@prisma/client";
import { GAME_DAY_LAYOUT, HUNT_LEVEL_POINTS, checkLiveRounds, contentSchema, huntSchema, privateJson, roundSettings } from "./game-day-content";

const database = new PrismaClient();
const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
const demo = args.includes("--demo");

async function main() {
  if (demo && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error("Demo seed is restricted to a local database");
  if (!demo && (!args.includes("--hunt") || !args.includes("--content"))) throw new Error("Use --demo, or --hunt <ignored JSON> --content <ignored JSON>");
  const content = demo ? null : contentSchema.parse(privateJson(option("--content")));
  const hunt = demo ? null : huntSchema.parse(privateJson(option("--hunt")));
  const eventId = demo ? "game-day-rehearsal" : content!.eventId;
  if (await database.gameEvent.findUnique({ where: { id: eventId } })) throw new Error("Event already exists. Seed a new event ID; existing play data is never overwritten.");
  const { titles, kinds } = GAME_DAY_LAYOUT;
  const words = ["lets", "change", "one", "persons", "world"];
  if (content) checkLiveRounds(content);
  await database.gameEvent.create({ data: {
    id: eventId, title: demo ? "Ashraya Game Day - Rehearsal" : content!.title, company: demo ? "Microsoft" : content!.company,
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
      ...roundSettings(kind), ...(kind === "HUNT_LEVEL" ? { maxPoints: HUNT_LEVEL_POINTS[levelIndex] } : {}),
      requiresVerification: kind === "HUNT_LEVEL" && levelIndex >= 3, isFinal: kind === "HUNT_LEVEL" && levelIndex === 4,
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
    for (const [alias, name] of [["maya_blr", "Maya"], ["arjun_pune", "Arjun"], ["isha_delhi", "Isha"], ["neel_mum", "Neel"]] as const) {
      await database.gameParticipant.upsert({ where: { alias }, create: { alias, name }, update: {} });
      await database.gameRegistration.createMany({ data: [{ eventId, alias }], skipDuplicates: true });
    }
    await database.$queryRaw`SELECT game_day_command(${eventId}, 'maya_blr', 'team.create', '{"name":"Team Udaan"}'::jsonb)`;
    await database.$queryRaw`SELECT game_day_command(${eventId}, 'neel_mum', 'team.create', '{"name":"Team Umang"}'::jsonb)`;
  }
  console.log(`Seeded ${eventId}: 17 rounds. No private answer content printed.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());