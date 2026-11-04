import type { RoundKind } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

export const GAME_DAY_LAYOUT: { titles: string[]; kinds: RoundKind[] } = {
  titles: ["Guess the Song 1", "Guess the Riddle 1", "Treasure Hunt - Level 1", "Treasure Hunt - Level 2", "Treasure Hunt - Level 3", "Verify your score", "Treasure Hunt - Level 4", "Treasure Hunt - Level 5", "Guess the Song 2", "Guess the Riddle 2", "Guess the Song 3", "Guess the Riddle 3", "Guess the Song 4", "Guess the Riddle 4", "Guess the Song 5", "Guess the Riddle 5", "Volunteering"],
  kinds: ["SONG", "RIDDLE", "HUNT_LEVEL", "HUNT_LEVEL", "HUNT_LEVEL", "VERIFY", "HUNT_LEVEL", "HUNT_LEVEL", "SONG", "RIDDLE", "SONG", "RIDDLE", "SONG", "RIDDLE", "SONG", "RIDDLE", "VOLUNTEER"],
};

export const LIVE_KINDS: RoundKind[] = ["SONG", "RIDDLE", "SCRIBBLE"];
export const HUNT_LEVEL_POINTS = [500, 875, 1250, 1625, 2000];

export function roundSettings(kind: RoundKind) {
  return {
    maxPoints: kind === "SCRIBBLE" ? 200 : 1000, graceSec: kind === "HUNT_LEVEL" ? 30 : kind === "SCRIBBLE" ? 5 : 3,
    halfLifeSec: kind === "HUNT_LEVEL" ? 240 : kind === "SCRIBBLE" ? 60 : 20, floorPct: 30,
    durationSec: kind === "SCRIBBLE" ? 180 : ["SONG", "RIDDLE"].includes(kind) ? 90 : null,
    maxAttempts: LIVE_KINDS.includes(kind) ? 3 : null,
  };
}

const hintSchema = z.object({ order: z.number().int().min(1).max(3).optional(), penaltyPct: z.number().min(0).max(99), text: z.string().min(1) });
export const huntSchema = z.object({ levels: z.array(z.object({
  title: z.string().min(1), card: z.string().min(1), answer: z.string().regex(/^key[1-5]_[A-Za-z0-9]{15,20}_.+$/),
  hints: z.array(hintSchema).length(3), revealOnSolve: z.string(), requiresVerification: z.boolean().optional(), isFinal: z.boolean().optional(),
})).length(5) });
const questionSchema = z.object({ prompt: z.string().optional(), mediaUrl: z.string().url().optional(), acceptedAnswers: z.array(z.string().min(1)).min(1), matchThreshold: z.number().min(0.8).max(0.95).default(0.85) });
export const contentSchema = z.object({
  eventId: z.string().min(1).max(80), title: z.string(), company: z.string(), location: z.string(), givingUrl: z.string().url(), verificationFormUrl: z.string().url(),
  rounds: z.array(z.object({ order: z.number().int().min(1).max(17), title: z.string().optional(), questions: z.array(questionSchema).min(1).max(10) })),
});

export function privateJson(path: string) {
  const absolute = resolve(path);
  try { execFileSync("git", ["check-ignore", "--quiet", absolute]); } catch { throw new Error("Private seeds must be gitignored and untracked"); }
  return JSON.parse(readFileSync(absolute, "utf8"));
}

export function checkLiveRounds(content: z.infer<typeof contentSchema>) {
  GAME_DAY_LAYOUT.kinds.forEach((kind, index) => {
    if (!LIVE_KINDS.includes(kind)) return;
    const expected = kind === "SCRIBBLE" ? 10 : 1;
    const round = content.rounds.find((entry) => entry.order === index + 1);
    if (!round || round.questions.length !== expected) throw new Error(`Round ${index + 1} needs ${expected} question${expected > 1 ? "s" : ""}`);
  });
}
