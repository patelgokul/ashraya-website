import { z } from "zod";

export const MAX_POINTS_PER_ENTRY = 1000;

const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

export const NAME_REQUIRED_MESSAGE = "Please enter your name to register";

export const GameRegisterSchema = z.object({
  name: z
    .string()
    .optional()
    .transform((value) => (value ? collapseSpaces(value) : undefined) || undefined)
    .pipe(z.string().min(2, "Name must be at least 2 characters").max(40, "Name must be 40 characters or fewer").optional()),
  alias: z
    .string({ required_error: "Alias is required" })
    .transform((value) => collapseSpaces(value).toLowerCase())
    .pipe(z.string().min(2, "Alias must be at least 2 characters").max(30, "Alias must be 30 characters or fewer")),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number").optional()),
});

export const GAME_OPTIONS = [
  "Snake Ladder",
  "Ring it for good",
  "Ring it for gift",
  "Memory Flip",
  "Roar & Score",
  "Lions Mouth",
  "Toss the ball",
  "Crash the cup",
] as const;

const gameName = z
  .string()
  .transform(collapseSpaces)
  .pipe(z.string().min(2, "Game name must be at least 2 characters").max(40, "Game name must be 40 characters or fewer"));

export const GameEventSchema = z.object({
  title: z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Event name must be at least 2 characters").max(80, "Event name must be 80 characters or fewer")),
  company: z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Company is required").max(80, "Company must be 80 characters or fewer")),
  location: z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Location is required").max(80, "Location must be 80 characters or fewer")),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  games: z.array(gameName).min(1, "Add at least one game").max(30, "An event can have at most 30 games"),
  givingUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().url("Enter a valid link").optional()),
});

export const GameScoreSchema = z.object({
  game: z.string().trim().min(1, "Please select a game"),
  points: z.coerce
    .number({ invalid_type_error: "Points must be a number" })
    .int("Points must be a whole number")
    .min(1, "Points must be at least 1")
    .max(MAX_POINTS_PER_ENTRY, `Points can't exceed ${MAX_POINTS_PER_ENTRY} per entry`),
});

export type GameRegisterInput = z.input<typeof GameRegisterSchema>;
export type GameScoreInput = z.input<typeof GameScoreSchema>;
export type GameEventInput = z.input<typeof GameEventSchema>;
