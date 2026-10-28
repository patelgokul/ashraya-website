import { z } from "zod";

export const MAX_POINTS_PER_ENTRY = 1000;

const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

export const GameRegisterSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Name must be at least 2 characters").max(40, "Name must be 40 characters or fewer")),
  alias: z
    .string({ required_error: "Alias is required" })
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Alias must be at least 2 characters").max(30, "Alias must be 30 characters or fewer")),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number").optional()),
});

export const GameScoreSchema = z.object({
  game: z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(2, "Game name must be at least 2 characters").max(40, "Game name must be 40 characters or fewer")),
  points: z.coerce
    .number({ invalid_type_error: "Points must be a number" })
    .int("Points must be a whole number")
    .min(1, "Points must be at least 1")
    .max(MAX_POINTS_PER_ENTRY, `Points can't exceed ${MAX_POINTS_PER_ENTRY} per entry`),
});

export type GameRegisterInput = z.input<typeof GameRegisterSchema>;
export type GameScoreInput = z.input<typeof GameScoreSchema>;
