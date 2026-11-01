import { PrismaClient } from "@prisma/client";
import { setTimeout as pace } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import { strict as assert } from "node:assert";

const database = new PrismaClient();
const base = new URL(process.env.GAME_TEST_URL ?? "http://127.0.0.1:3000");
const seconds = Number(process.env.GAME_LOAD_SECONDS ?? 300);
const clients = 150;
const intervalMs = 5000;
const runId = crypto.randomUUID().slice(0, 8);
const eventId = `load-${runId}`;
const aliases = Array.from({ length: clients }, (_, index) => `load_${runId}_${index}`);
const durations: number[] = [];
const failures = new Map<string, number>();

async function main() {
  assert.ok(["localhost", "127.0.0.1"].includes(base.hostname), "Load test only supports a local server");
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname), "Load test only supports a local database");
  assert.ok(Number.isFinite(seconds) && seconds >= 10 && seconds <= 600, "Use 10-600 seconds");
  const template = await database.gameEvent.findUniqueOrThrow({ where: { id: "game-day-rehearsal" }, include: { rounds: { include: { questions: true } } } });
  try {
    await database.gameEvent.create({ data: { id: eventId, title: "Local load rehearsal", company: "Test", location: "Local", eventDate: new Date(), games: template.games } });
    await database.gameParticipant.createMany({ data: aliases.map((alias) => ({ alias, name: alias })) });
    await database.gameRegistration.createMany({ data: aliases.map((alias) => ({ eventId, alias })) });
    for (const source of template.rounds) {
      const { id: sourceId, eventId: sourceEvent, questions, ...round } = source;
      await database.gameRound.create({ data: { ...round, eventId, openedAt: new Date(), closedAt: null, questions: { create: questions.map(({ id: questionId, roundId, ...question }) => ({ ...question, hints: question.hints ?? [] })) } } });
    }
    for (let index = 0; index < clients; index += 5) {
      await database.team.create({ data: { eventId, name: `Load team ${index / 5 + 1}`, captainAlias: aliases[index], members: { create: aliases.slice(index, index + 5).map((alias, slot) => ({ eventId, alias, slot: slot + 1 })) } } });
    }
    const listing = await fetch(new URL("/api/games/events", base)).then((response) => response.json());
    assert.equal(listing.events.find((event: { id: string }) => event.id === eventId).participantCount, clients);
    const endpoint = new URL(`/api/games/events/${eventId}/state`, base);
    await fetch(endpoint, { headers: { cookie: `ashraya_game_alias=${aliases[0]}` } }).then((response) => response.arrayBuffer());
    console.log(`Polling with ${clients} clients / 30 teams every ${intervalMs / 1000}s for ${seconds}s`);
    const stopAt = performance.now() + seconds * 1000;
    await Promise.all(aliases.map(async (alias, index) => {
      await pace(index * intervalMs / clients);
      while (performance.now() < stopAt) {
        const startedAt = performance.now();
        try {
          const response = await fetch(endpoint, { headers: { cookie: `ashraya_game_alias=${alias}` }, signal: AbortSignal.timeout(10000) });
          const state = await response.json();
          if (!response.ok || state.me?.alias !== alias || state.rounds?.length !== 17) throw new Error(`Invalid state (${response.status})`);
          durations.push(performance.now() - startedAt);
        } catch (error) {
          const message = (error as Error).message;
          failures.set(message, (failures.get(message) ?? 0) + 1);
        }
        const nextAt = Math.min(stopAt, startedAt + intervalMs);
        if (nextAt > performance.now()) await pace(nextAt - performance.now());
      }
    }));
    durations.sort((first, second) => first - second);
    const percentile = (fraction: number) => Math.round(durations[Math.min(durations.length - 1, Math.floor(durations.length * fraction))] ?? 0);
    const report = { successfulPolls: durations.length, errors: Object.fromEntries(failures), p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), maxMs: Math.round(durations.at(-1) ?? 0) };
    console.log(JSON.stringify(report, null, 2));
    assert.equal(failures.size, 0, "Load rehearsal returned errors");
    assert.ok(report.p95Ms < 500, "Local state p95 exceeds the 500ms target");
  } finally {
    await database.gameScore.deleteMany({ where: { eventId } });
    await database.gameEvent.deleteMany({ where: { id: eventId } });
    await database.gameParticipant.deleteMany({ where: { alias: { in: aliases } } });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => database.$disconnect());