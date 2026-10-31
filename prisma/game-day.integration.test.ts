import { strict as assert } from "node:assert";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();
const enabled = process.env.GAME_DB_TESTS === "1";

test("atomic team slots, captain succession, hunt solve, verification and deadline", { skip: !enabled }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname), "Integration tests require a local database");
  const eventId = `race-${crypto.randomUUID()}`;
  const aliases = Array.from({ length: 7 }, (_, index) => `${eventId}-${index}`);
  const command = async (alias: string, action: string, payload: object) => {
    const result = await database.$queryRaw<{ result: Record<string, unknown> }[]>`SELECT game_day_command(${eventId}, ${alias}, ${action}, ${JSON.stringify(payload)}::jsonb) AS result`;
    return result[0].result;
  };
  try {
    await database.gameEvent.create({ data: { id: eventId, title: "Race test", company: "Test", location: "Local", eventDate: new Date(), games: [] } });
    await database.gameParticipant.createMany({ data: aliases.map((alias, index) => ({ alias, name: alias, isAdmin: index === 0 })) });
    await database.gameRegistration.createMany({ data: aliases.map((alias) => ({ eventId, alias })) });
    const created = await command(aliases[0], "team.create", { name: "Race team" });
    const teamId = created.teamId as string;
    const joins = await Promise.allSettled(aliases.slice(1).map((alias) => command(alias, "team.join", { teamId })));
    assert.equal(joins.filter((result) => result.status === "fulfilled").length, 4);
    assert.equal(await database.teamMember.count({ where: { teamId } }), 5);
    await assert.rejects(command(aliases[0], "team.create", { name: "Second team" }));
    await command(aliases[0], "team.leave", { teamId });
    const newCaptain = (await database.team.findUniqueOrThrow({ where: { id: teamId } })).captainAlias;
    assert.notEqual(newCaptain, aliases[0]);
    await command(aliases[0], "team.join", { teamId });
    const rounds = [];
    for (let index = 1; index <= 5; index++) {
      const round = await database.gameRound.create({ data: { eventId, order: index, kind: "HUNT_LEVEL", title: `L${index}`, graceSec: 30, halfLifeSec: 240, requiresVerification: index >= 4, isFinal: index === 5 } });
      const question = await database.gameQuestion.create({ data: { roundId: round.id, acceptedAnswers: ["test"], hints: [20, 50, 80].map((penaltyPct) => ({ text: "test", penaltyPct })) } });
      rounds.push({ ...round, question });
    }
    await command(aliases[0], "admin.round.open", { roundId: rounds[0].id });
    await assert.rejects(command(newCaptain, "team.leave", { teamId }));
    const members = await database.teamMember.findMany({ where: { teamId } });
    const solutions = await Promise.all(members.slice(0, 2).map((member) => command(member.alias, "answer", { questionId: rounds[0].question.id, answer: "test", correct: true, similarity: 1 })));
    assert.ok(solutions.every((result) => result.correct));
    assert.equal(await database.gameScore.count({ where: { roundId: rounds[0].id, teamId } }), 1);
    assert.equal(await database.teamLevelProgress.count({ where: { teamId } }), 2);
    await command(aliases[0], "admin.hunt.solve", { teamId, roundId: rounds[1].id, reason: "Test progression" });
    await command(aliases[0], "admin.hunt.solve", { teamId, roundId: rounds[2].id, reason: "Test progression" });
    await assert.rejects(command(newCaptain, "answer", { questionId: rounds[3].question.id, answer: "test", correct: true, similarity: 1 }), /Benevity/);
    await command(aliases[0], "admin.verification", { alias: newCaptain, status: "APPROVED", reason: "Test" });
    await command(newCaptain, "hint", { roundId: rounds[3].id, hint: 1 });
    await assert.rejects(command(newCaptain, "hint", { roundId: rounds[3].id, hint: 3 }), /order/);
    await command(newCaptain, "hint", { roundId: rounds[3].id, hint: 2 });
    await command(aliases[0], "admin.hunt.solve", { teamId, roundId: rounds[3].id, reason: "Test hints" });
    assert.equal((await database.gameScore.findFirstOrThrow({ where: { teamId, roundId: rounds[3].id } })).points, 500);
    await command(aliases[0], "admin.hunt.refund", { teamId, roundId: rounds[3].id, reason: "Test refund" });
    assert.equal(await database.gameScore.count({ where: { teamId, game: "Hint refund" } }), 1);
    await command(aliases[0], "admin.hunt.refund", { teamId, roundId: rounds[3].id, reason: "Repeat refund" });
    assert.equal(await database.gameScore.count({ where: { teamId, game: "Hint refund" } }), 1);
    await database.gameEvent.update({ where: { id: eventId }, data: { huntDeadlineAt: new Date(0) } });
    await assert.rejects(command(newCaptain, "answer", { questionId: rounds[4].question.id, correct: true, answer: "test", similarity: 1 }), /deadline/);
    await command(aliases[0], "admin.hunt.reset", { teamId, roundId: rounds[3].id, reason: "Test reset" });
    assert.equal(await database.gameScore.count({ where: { teamId, game: "Hint refund" } }), 0);
  } finally {
    await database.gameScore.deleteMany({ where: { eventId } });
    await database.scoreVerification.deleteMany({ where: { eventId } });
    await database.gameAudit.deleteMany({ where: { eventId } });
    await database.gameEvent.deleteMany({ where: { id: eventId } });
    await database.gameParticipant.deleteMany({ where: { alias: { in: aliases } } });
    await database.$disconnect();
  }
});

test("participant rename, merge and delete preserve shared awards and deduplicate answers", { skip: !enabled }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname), "Integration tests require a local database");
  const eventId = `participants-${crypto.randomUUID()}`;
  const [admin, source, target, renamed] = ["admin", "source", "target", "renamed"].map((suffix) => `${eventId}-${suffix}`);
  const command = async (action: string, payload: object) => database.$queryRaw`SELECT game_participant_command(${eventId}, ${admin}, ${action}, ${JSON.stringify({ ...payload, reason: "Test participant operations" })}::jsonb)`;
  try {
    await database.gameEvent.create({ data: { id: eventId, title: "Participant test", company: "Test", location: "Local", eventDate: new Date(), games: [] } });
    await database.gameParticipant.createMany({ data: [admin, source, target].map((alias) => ({ alias, name: alias, isAdmin: alias === admin })) });
    await database.gameRegistration.createMany({ data: [admin, source, target].map((alias) => ({ eventId, alias })) });
    const team = await database.team.create({ data: { eventId, name: "Merge team", captainAlias: source, members: { create: [{ eventId, alias: source, slot: 1 }, { eventId, alias: target, slot: 2 }] } } });
    await database.gameScore.createMany({ data: [
      { alias: source, eventId, game: "Song", points: 100, questionId: `${eventId}-question` },
      { alias: target, eventId, game: "Song", points: 200, questionId: `${eventId}-question` },
      { alias: source, eventId, game: "Hunt", points: 500, teamId: team.id },
    ] });
    await database.scoreVerification.create({ data: { eventId, alias: source, hours: 1, status: "APPROVED" } });
    await command("admin.participant.rename", { alias: source, newAlias: renamed });
    assert.equal(await database.gameParticipant.count({ where: { alias: source } }), 0);
    assert.equal((await database.team.findUniqueOrThrow({ where: { id: team.id } })).captainAlias, renamed);
    assert.equal(await database.scoreVerification.count({ where: { eventId, alias: renamed } }), 1);
    await command("admin.participant.merge", { alias: renamed, targetAlias: target });
    assert.equal(await database.gameParticipant.count({ where: { alias: renamed } }), 0);
    assert.equal(await database.teamMember.count({ where: { teamId: team.id } }), 1);
    assert.equal((await database.team.findUniqueOrThrow({ where: { id: team.id } })).captainAlias, target);
    assert.equal((await database.gameScore.aggregate({ where: { eventId, alias: target, teamId: null, voidedAt: null }, _sum: { points: true } }))._sum.points, 200);
    await assert.rejects(command("admin.participant.delete", { alias: admin }), /Admin aliases/);
    await database.teamMember.create({ data: { eventId, alias: admin, teamId: team.id, slot: 1 } });
    await command("admin.participant.delete", { alias: target });
    assert.equal(await database.gameScore.count({ where: { eventId, teamId: null } }), 0);
    const shared = await database.gameScore.findFirstOrThrow({ where: { eventId, teamId: team.id } });
    assert.equal(shared.alias, admin);
    assert.equal(shared.points, 500);
    assert.equal(shared.voidedAt, null);
    assert.equal((await database.team.findUniqueOrThrow({ where: { id: team.id } })).captainAlias, admin);
  } finally {
    await database.gameScore.deleteMany({ where: { eventId } });
    await database.scoreVerification.deleteMany({ where: { eventId } });
    await database.gameAudit.deleteMany({ where: { eventId } });
    await database.gameEvent.deleteMany({ where: { id: eventId } });
    await database.gameParticipant.deleteMany({ where: { alias: { in: [admin, source, target, renamed] } } });
    await database.$disconnect();
  }
});