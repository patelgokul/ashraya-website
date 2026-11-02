import { strict as assert } from "node:assert";
import { test } from "node:test";
import { compareRanks, csvCell, matchAnswer, matchHuntKey, scoreAnswer } from "./game-rules";

test("required fuzzy matching examples", () => {
  const cases: [string[], string, boolean][] = [
    [["dilwale dulhania le jayenge"], "Dilwaale Dulhaniya Le Jaayenge", true],
    [["dilwale dulhania le jayenge", "ddlj"], "DDLJ", true],
    [["3 idiots"], "three idiots", true], [["the lion king"], "Lion King", true],
    [["kabhi khushi kabhie gham"], "kabhi khushi kabhi gham", true],
    [["sholay"], "sholey", false], [["sholay"], "shor", false],
    [["kal ho naa ho"], "ho naa ho kal", true], [["don"], "dhoom", false],
    [["ddlj"], "ddlk", false], [["चाँद"], "चाँद", true], [["don"], "", false],
  ];
  for (const [accepted, input, expected] of cases) assert.equal(matchAnswer(input, accepted).correct, expected, input);
});

test("server scoring examples and hint floors", () => {
  for (const [elapsedSec, points] of [[3, 1000], [13, 795], [23, 650], [43, 475], [63, 388], [90, 334]]) {
    assert.equal(scoreAnswer({ elapsedSec }), points);
  }
  for (const [elapsedSec, points] of [[150, 795], [270, 650], [510, 475]]) {
    assert.equal(scoreAnswer({ elapsedSec, graceSec: 30, halfLifeSec: 240 }), points);
  }
  assert.equal(scoreAnswer({ elapsedSec: 510, graceSec: 30, halfLifeSec: 240, penaltyPct: 50 }), 238);
  assert.equal(scoreAnswer({ elapsedSec: 1e6, penaltyPct: 80 }), 60);
  assert.equal(scoreAnswer({ elapsedSec: -10 }), 1000);
});

test("hunt random part stays case sensitive", () => {
  const key = "key1_RandomSecret12345_Let's";
  assert.ok(matchHuntKey(' "KEY1_RandomSecret12345_lets" ', key));
  assert.ok(matchHuntKey("key1_RandomSecret12345_Let", key));
  assert.ok(matchHuntKey("KEY1_RandomSecret12345_let's", key));
  assert.ok(matchHuntKey("key4_RandomSecret12345_Person", "key4_RandomSecret12345_Person's"));
  assert.ok(!matchHuntKey("key1_randomSecret12345_lets", key));
  assert.ok(!matchHuntKey("key1_RandomSecret12345_Le", key));
  assert.ok(!matchHuntKey("key2_RandomSecret12345_lets", key));
});

test("ranking breaks ties by time then alias; CSV neutralizes formulas", () => {
  const entries = [
    { points: 10, lastAnswer: "2026-11-04T10:00:02Z", alias: "first" },
    { points: 10, lastAnswer: "2026-11-04T10:00:01Z", alias: "zulu" },
    { points: 10, lastAnswer: "2026-11-04T10:00:01Z", alias: "alpha" },
  ];
  assert.deepEqual(entries.sort(compareRanks).map((entry) => entry.alias), ["alpha", "zulu", "first"]);
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
});