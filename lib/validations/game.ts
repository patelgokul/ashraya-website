import { z } from "zod";
import { OFFICE_LOCATION_IDS } from "@/lib/give-hamper";

export const MAX_POINTS_PER_ENTRY = 1000;

const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

const aliasSchema = z
  .string({ required_error: "Alias is required" })
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9_-]{3,20}$/, "Use 3-20 letters, numbers, underscores or hyphens")
    .refine((value) => !["admin", "host", "ashraya", "system"].includes(value), "This alias is reserved"));

const nameSchema = z
  .string({ required_error: "Name is required" })
  .transform(collapseSpaces)
  .pipe(z.string().min(2, "Name must be at least 2 characters").max(80, "Name must be 80 characters or fewer"));

export function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const phoneSchema = z
  .string({ required_error: "Mobile number is required" })
  .transform(normalizeMobile)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"));

export const officeLocationSchema = z.enum(OFFICE_LOCATION_IDS, { errorMap: () => ({ message: "Select your office location" }) });

export const GameLoginSchema = z.object({ alias: aliasSchema });

export const GameRegisterSchema = z.object({
  alias: aliasSchema,
  name: nameSchema,
  phone: phoneSchema,
  officeLocation: officeLocationSchema.optional(),
});

export const OfficeRegisterSchema = GameRegisterSchema.extend({ officeLocation: officeLocationSchema });

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
