import { expect, test, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import type { GameState } from "../lib/game-state";

const database = new PrismaClient();
const suffix = crypto.randomUUID().slice(0, 8);
const eventId = `browser-${suffix}`;
const playerAlias = `player_${suffix}`;
const teammateAlias = `mate_${suffix}`;
const hostAlias = `host_${suffix}`;
const path = `/api/games/events/${eventId}`;

test.beforeAll(async () => {
  expect(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname)).toBeTruthy();
  const source = await database.gameEvent.findUniqueOrThrow({ where: { id: "game-day-rehearsal" }, include: { rounds: { include: { questions: true }, orderBy: { order: "asc" } } } });
  await database.gameEvent.create({ data: { id: eventId, title: "Ashraya Game Day - Browser Rehearsal", company: "Ashraya", location: "Online", eventDate: source.eventDate, games: source.games, givingUrl: source.givingUrl, verificationFormUrl: source.verificationFormUrl } });
  for (const round of source.rounds) {
    const { id, questions, eventId: sourceEventId, openedAt, closedAt, ...roundData } = round;
    const newId = `${eventId}-r${round.order}`;
    await database.gameRound.create({ data: { ...roundData, id: newId, eventId, openedAt: round.kind === "VERIFY" ? new Date() : null } });
    for (const question of questions) {
      await database.gameQuestion.create({ data: { id: `${newId}-q${question.order}`, roundId: newId, order: question.order, prompt: question.prompt, mediaUrl: question.mediaUrl, acceptedAnswers: question.acceptedAnswers, matchThreshold: question.matchThreshold, hints: question.hints ?? [], revealOnSolve: question.revealOnSolve } });
    }
  }
  await database.gameParticipant.create({ data: { alias: hostAlias, name: hostAlias, isAdmin: true } });
});

test.afterAll(async () => {
  await database.gameScore.deleteMany({ where: { eventId } });
  await database.gameAudit.deleteMany({ where: { OR: [{ eventId }, { actor: hostAlias }] } });
  await database.scoreVerification.deleteMany({ where: { eventId } });
  await database.volunteerPledge.deleteMany({ where: { eventId } });
  await database.gameEvent.deleteMany({ where: { id: eventId } });
  await database.gamePinAttempt.deleteMany({ where: { alias: hostAlias } });
  await database.gameParticipant.deleteMany({ where: { alias: { in: [playerAlias, teammateAlias, hostAlias] } } });
  await database.$disconnect();
});

test("17-round website rehearsal, security, team gating and responsive UI", async ({ browser }) => {
  const baseURL = process.env.GAME_TEST_URL ?? "http://127.0.0.1:3000";
  const player = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const host = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const teammate = await browser.newContext({ baseURL });
  const page = await player.newPage();
  const hostPage = await host.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = async (context = player): Promise<GameState> => (await context.request.get(`${path}/state`)).json();
  const action = (context: BrowserContext, data: object) => context.request.post(`${path}/action`, { data });
  const admin = async (data: object) => {
    const response = await host.request.post(`${path}/admin`, { data });
    expect(response.ok(), await response.text()).toBeTruthy();
  };
  const answer = async (questionId: string, value: string) => {
    let result: { correct: boolean; points: number; bonus?: number; finishPlace?: number };
    await expect(async () => {
      const response = await action(player, { action: "answer", questionId, answer: value, points: 999999999 });
      expect(response.ok(), await response.text()).toBeTruthy();
      result = await response.json();
      expect(result.correct).toBeTruthy();
    }).toPass({ intervals: [1000], timeout: 8000 });
    return result!;
  };
  try {
    expect((await player.request.post("/api/games/register", { data: { alias: "admin", name: "Reserved", phone: "9876543210" } })).status()).toBe(400);
    expect((await player.request.post("/api/games/register", { data: { alias: playerAlias, name: "Browser Player", phone: "9876543210" }, headers: { origin: "https://untrusted.invalid" } })).status()).toBe(403);
    const missing = await player.request.post("/api/games/login", { data: { alias: `missing_${suffix}` } });
    expect(missing.status()).toBe(404);
    expect((await missing.json()).code).toBe("NOT_REGISTERED");
    await page.goto(`/games/${eventId}`);
    await page.getByRole("button", { name: "Already registered? Log in" }).click();
    await page.getByLabel("Your Ashraya alias", { exact: true }).fill(`missing_${suffix}`);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText("This alias is not registered. Please register to continue.")).toBeVisible();
    await page.getByLabel("Your Ashraya alias", { exact: true }).fill(playerAlias.toUpperCase());
    await page.getByLabel("Your name", { exact: true }).fill("Browser Player");
    await page.getByLabel("Contact number", { exact: true }).fill("9876543210");
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The playbook" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
    const initial = await state();
    expect(initial.me?.alias).toBe(playerAlias);
    expect(initial.me?.name).toBe("Browser Player");
    expect(initial.rounds).toHaveLength(17);
    expect(initial.rounds.filter((round) => round.state === "LOCKED").every((round) => !round.questions.length && !round.description)).toBeTruthy();
    expect(JSON.stringify(initial)).not.toContain("acceptedAnswers");
    expect((await player.request.post(`${path}/scores`, { data: { points: 1000, game: "Song" } })).status()).toBe(403);
    expect((await player.request.get(`${path}/admin`)).status()).toBe(403);
    expect((await player.request.post("/api/games/events", { data: {} })).status()).toBe(403);
    await page.getByLabel("Team name", { exact: true }).fill("Browser Team");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Browser Team", exact: true })).toBeVisible();
    const teamId = (await state()).team!.id;
    await teammate.request.post("/api/games/register", { data: { alias: teammateAlias, name: "Browser Mate", phone: "9876543211" } });
    await state(teammate);
    expect((await action(teammate, { action: "team.join", teamId })).ok()).toBeTruthy();
    await host.request.post("/api/games/login", { data: { alias: hostAlias } });
    await state(host);
    expect((await host.request.get(`${path}/admin`)).status()).toBe(403);
    await hostPage.goto(`/games/${eventId}/admin`);
    await hostPage.getByLabel("Admin PIN").fill(process.env.GAME_ADMIN_PIN ?? "246810");
    await hostPage.getByRole("button", { name: "Unlock console" }).click();
    await expect(hostPage.getByRole("tab", { name: "Rounds", exact: true })).toBeVisible();
    await hostPage.getByRole("button", { name: "Open Guess the Song 1", exact: true }).click();
    await expect.poll(async () => (await state()).rounds[0].state).toBe("LIVE");
    await page.reload();
    await page.getByLabel("Which movie is this song from?").fill("definitely wrong");
    await page.getByLabel("Which movie is this song from?").press("Enter");
    await expect(page.getByText("Not quite - try again", { exact: true })).toBeVisible();
    await expect(async () => {
      await page.getByLabel("Which movie is this song from?").fill("three idiots");
      await page.getByLabel("Which movie is this song from?").press("Enter");
      await expect(page.getByRole("heading", { name: "Correct!", exact: true })).toBeVisible({ timeout: 700 });
    }).toPass({ intervals: [1000], timeout: 10000 });
    await expect.poll(async () => page.locator("canvas").evaluateAll((canvases) => canvases.some((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext("2d");
      if (!context) return false;
      return context.getImageData(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height).data.some((value, index) => index % 4 === 3 && value > 0);
    })), { timeout: 2000 }).toBeTruthy();
    await page.screenshot({ path: ".game-day/desktop-celebration.png" });
    await expect(page.getByRole("heading", { name: "Correct!", exact: true })).not.toBeVisible();
    await expect(page.getByLabel("Round timer")).toContainText("Round closes in");
    await expect.poll(async () => {
      const section = await page.locator(`#round-${eventId}-r6`).boundingBox();
      const header = await page.locator(".game-day > header").boundingBox();
      return !!section && !!header && section.y >= header.y + header.height && section.y < 800;
    }).toBeTruthy();
    await page.screenshot({ path: ".game-day/desktop-game.png" });
    await admin({ action: "admin.round.open", roundId: `${eventId}-r2` });
    await answer(`${eventId}-r2-q0`, "moon");
    await admin({ action: "admin.round.open", roundId: `${eventId}-r3` });
    expect((await action(player, { action: "team.leave", teamId })).status()).toBe(409);
    await action(player, { action: "hint", roundId: `${eventId}-r3`, hint: 1 });
    await action(teammate, { action: "hint", roundId: `${eventId}-r3`, hint: 2 });
    const hinted = (await state()).rounds[2];
    expect(hinted.highestHint).toBe(2);
    expect(hinted.questions[0].hints[2].text).toBeNull();
    const levelOne = await answer(`${eventId}-r3-q0`, "KEY1_DemoOnlyToken00001_LETS");
    expect(levelOne.points).toBeLessThanOrEqual(500);
    await answer(`${eventId}-r4-q0`, "key2_DemoOnlyToken00001_change");
    await answer(`${eventId}-r5-q0`, "key3_DemoOnlyToken00001_one");
    expect((await state()).rounds[6].questions).toHaveLength(0);
    expect((await action(player, { action: "answer", questionId: `${eventId}-r7-q0`, answer: "key4_DemoOnlyToken00001_persons" })).status()).toBe(409);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByRole("button", { name: /06 Verify your score/ }).click();
    await page.getByLabel("Hours logged").fill("1.5");
    await page.getByLabel("Confirmation screenshot").setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
    await page.getByRole("button", { name: "Submit screenshot" }).click();
    await expect.poll(async () => (await state()).verification?.status).toBe("SUBMITTED");
    expect((await state(teammate)).rounds[6].questions).toHaveLength(0);
    await answer(`${eventId}-r7-q0`, "key4_DemoOnlyToken00001_persons");
    const finish = await answer(`${eventId}-r8-q0`, "key5_DemoOnlyToken00001_world");
    expect(finish.finishPlace).toBe(1); expect(finish.bonus).toBe(500);
    expect((await state(teammate)).rounds[7].questions).toHaveLength(0);
    await admin({ action: "admin.verification", alias: playerAlias, status: "APPROVED", reason: "Local rehearsal screenshot review" });
    expect((await state()).boards.individual.find((entry) => entry.alias === playerAlias)?.verified).toBeTruthy();
    for (const order of [9, 10, 11, 12, 13, 14, 15, 16]) {
      await admin({ action: "admin.round.open", roundId: `${eventId}-r${order}` });
      const questions = await database.gameQuestion.findMany({ where: { roundId: `${eventId}-r${order}` }, orderBy: { order: "asc" } });
      if (order === 13) {
        await page.reload();
        await expect(page.locator('img[alt^="Question "]')).toHaveCount(10);
        for (const image of await page.locator('img[alt^="Question "]').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(async () => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBeTruthy();
        }
        await page.locator(`#round-${eventId}-r13`).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
        await page.screenshot({ path: ".game-day/mobile-scribble.png" });
      }
      for (const question of questions) await answer(question.id, question.acceptedAnswers[0]);
    }
    await admin({ action: "admin.round.open", roundId: `${eventId}-r17` });
    await page.reload();
    await page.getByRole("button", { name: /17 Volunteering/ }).click();
    await page.getByLabel("Name", { exact: true }).fill("=SUM(1,1)");
    await page.getByLabel("Email", { exact: true }).fill("rehearsal@example.invalid");
    await page.getByLabel("Mode", { exact: true }).selectOption("BOTH");
    await page.getByLabel("City", { exact: true }).fill("Bengaluru");
    await page.getByLabel("Website & tech development", { exact: true }).check();
    await page.getByLabel("Ashraya may contact me about volunteering").check();
    await page.getByRole("button", { name: "Save preferences", exact: true }).click();
    await expect(page.getByText("Your volunteering preferences have been saved.")).toBeVisible();
    const final = await state();
    expect(final.rounds.filter((round) => round.state === "DONE")).toHaveLength(17);
    expect(final.boards.individual.find((entry) => entry.alias === playerAlias)!.points).toBeLessThanOrEqual(12000);
    const csv = await host.request.get(`${path}/volunteers.csv`);
    expect(csv.ok()).toBeTruthy(); expect(await csv.text()).toContain("'=SUM(1,1)");
    expect((await player.request.get(`${path}/volunteers.csv`)).status()).toBe(403);
    await page.getByRole("tab", { name: /^standings$/i }).click();
    await expect(page.getByRole("heading", { name: "Leaderboard", exact: true })).toBeInViewport();
    await page.screenshot({ path: ".game-day/mobile-leaderboard.png" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    const score = await database.gameScore.findFirstOrThrow({ where: { eventId, questionId: `${eventId}-r1-q0`, alias: playerAlias } });
    await admin({ action: "admin.score.void", scoreId: score.id, reason: "Test void tombstone" });
    await admin({ action: "admin.round.open", roundId: `${eventId}-r1` });
    expect((await answer(`${eventId}-r1-q0`, "three idiots")).points).toBe(0);
    expect(await database.gameScore.count({ where: { eventId, questionId: `${eventId}-r1-q0`, alias: playerAlias } })).toBe(1);
    await database.gameScore.createMany({ data: Array.from({ length: 205 }, () => ({ eventId, alias: playerAlias, game: "Pagination test", points: 0 })) });
    const firstScores = await (await host.request.get(`${path}/admin`)).json();
    const secondScores = await (await host.request.get(`${path}/admin?scorePage=1`)).json();
    expect(firstScores.scores).toHaveLength(200);
    expect(firstScores.hasMoreScores).toBeTruthy();
    expect(secondScores.hasMoreScores).toBeFalsy();
    expect(new Set([...firstScores.scores, ...secondScores.scores].map((entry) => entry.id)).size).toBe(await database.gameScore.count({ where: { eventId } }));
    await hostPage.reload();
    await expect(hostPage.getByRole("tab", { name: "Scores", exact: true })).toHaveCount(0);
    await expect(hostPage.getByRole("tab", { name: "Participants", exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { await Promise.all([player.close(), host.close(), teammate.close()]); }
});