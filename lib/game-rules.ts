import { distance } from "fastest-levenshtein";

const numbers: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

export function normalizeAnswer(value: string) {
  return value.normalize("NFKD").replace(/(?<=\p{Script=Latin})\p{M}+/gu, "")
    .toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, "")
    .trim().replace(/\s+/g, " ").replace(/^(the|an|a)\s+/, "")
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (word) => numbers[word])
    .replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u")
    .replace(/ph/g, "f").replace(/w/g, "v").replace(/([bcdfghjklmnpqrstvxzy])\1+/g, "$1");
}

export function matchAnswer(input: string, accepted: string[], threshold = 0.85) {
  const given = normalizeAnswer(input);
  const ratio = (left: string, right: string) => 1 - distance(left, right) / Math.max(left.length, right.length, 1);
  const sort = (value: string) => value.split(" ").sort().join(" ");
  const similarity = Math.max(0, ...accepted.map((answer) => {
    const expected = normalizeAnswer(answer);
    if (!expected || !given) return 0;
    if (Math.min(expected.length, given.length) <= 4) return Number(expected === given);
    return Math.max(ratio(given, expected), ratio(sort(given), sort(expected)));
  }));
  return { similarity, correct: similarity >= threshold, closeCall: similarity >= 0.65 && similarity < threshold };
}

function huntWordForms(word: string) {
  const lower = word.toLowerCase();
  const forms = new Set([lower.replace(/['\u2018\u2019]/g, "")]);
  // Double-click stops at the apostrophe, so "Let's" is copied as "Let" and "Person's" as "Person".
  if (/['\u2018\u2019]s$/i.test(lower)) forms.add(lower.slice(0, -2));
  return forms;
}

export function matchHuntKey(input: string, expected: string) {
  const given = input.trim().replace(/^["'`]+|["'`]+$/g, "").split("_");
  const parts = expected.split("_");
  if (given.length !== 3 || parts.length !== 3) return false;
  const submitted = huntWordForms(given[2]);
  return given[0].toLowerCase() === parts[0].toLowerCase() && given[1] === parts[1]
    && [...huntWordForms(parts[2])].some((form) => submitted.has(form));
}

export function scoreAnswer({ elapsedSec, maxPoints = 1000, graceSec = 3, halfLifeSec = 20, floorPct = 30, penaltyPct = 0 }: {
  elapsedSec: number; maxPoints?: number; graceSec?: number; halfLifeSec?: number; floorPct?: number; penaltyPct?: number;
}) {
  const floor = floorPct / 100;
  const floorPoints = maxPoints * floor;
  return Math.round((floorPoints + (maxPoints - floorPoints) * Math.pow(0.5, Math.max(0, elapsedSec - graceSec) / halfLifeSec)) * (1 - penaltyPct / 100));
}

export function compareRanks(left: { points: number; lastAnswer: string | null; alias: string }, right: { points: number; lastAnswer: string | null; alias: string }) {
  return right.points - left.points
    || (left.lastAnswer ? Date.parse(left.lastAnswer) : Infinity) - (right.lastAnswer ? Date.parse(right.lastAnswer) : Infinity)
    || left.alias.localeCompare(right.alias);
}

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
}