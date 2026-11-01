import { z } from "zod";
import { GameRegisterSchema } from "./game";

const id = z.string().min(1).max(100);
const alias = z.string().trim().toLowerCase().min(1).max(30);
const name = z.string().trim().min(2).max(30);
const reason = z.string().trim().min(3, "Please give a reason").max(500);
export const hoursSchema = z.coerce.number().min(0.25).max(24).multipleOf(0.25);

export const playerActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("team.create"), name }),
  z.object({ action: z.literal("team.join"), teamId: id, alias: alias.optional() }),
  z.object({ action: z.literal("team.leave"), teamId: id, alias: alias.optional() }),
  z.object({ action: z.literal("answer"), questionId: id, answer: z.string().trim().min(1).max(300) }),
  z.object({ action: z.literal("hint"), roundId: id, hint: z.number().int().min(1).max(3) }),
  z.object({ action: z.literal("verification"), hours: hoursSchema, note: z.string().trim().max(500).optional(), confirmed: z.literal(true) }),
]);

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("admin.round.open"), roundId: id }),
  z.object({ action: z.literal("admin.round.close"), roundId: id }),
  z.object({ action: z.literal("admin.round.extend"), roundId: id, seconds: z.number().int().min(10).max(7200) }),
  z.object({ action: z.literal("admin.team.create"), name, alias }),
  z.object({ action: z.literal("admin.team.rename"), teamId: id, name }),
  z.object({ action: z.literal("admin.team.move"), teamId: id, alias }),
  z.object({ action: z.literal("admin.team.disband"), teamId: id, reason }),
  z.object({ action: z.literal("admin.team.auto") }),
  z.object({ action: z.literal("admin.team.lock"), locked: z.boolean() }),
  z.object({ action: z.literal("admin.score.award"), alias: alias.optional(), teamId: id.optional(), points: z.number().int().min(-100000).max(100000), reason }),
  z.object({ action: z.literal("admin.score.adjust"), scoreId: id, points: z.number().int().min(-100000).max(100000), reason }),
  z.object({ action: z.literal("admin.score.void"), scoreId: id, reason }),
  z.object({ action: z.literal("admin.hunt.solve"), teamId: id, roundId: id, reason }),
  z.object({ action: z.literal("admin.hunt.reset"), teamId: id, roundId: id, reason }),
  z.object({ action: z.literal("admin.hunt.refund"), teamId: id, roundId: id, reason }),
  z.object({ action: z.literal("admin.verification"), alias, status: z.enum(["APPROVED", "REJECTED"]), hours: hoursSchema.optional(), reason }),
  z.object({ action: z.literal("admin.participant.rename"), alias, newAlias: GameRegisterSchema.shape.alias, reason }),
  z.object({ action: z.literal("admin.participant.merge"), alias, targetAlias: alias, reason }),
  z.object({ action: z.literal("admin.participant.delete"), alias, reason }),
]);

export const volunteerInterests = [
  "Teaching - primary school (classes 1-5)", "Teaching - middle school (classes 6-8)",
  "Teaching - high school / exam prep (classes 9-12)", "Spoken English & communication",
  "Computer literacy / coding for kids", "Website & tech development", "Design, social media & content",
  "Content writing & translation", "Photography & video", "Painting, art & craft", "Music & dance",
  "Yoga & fitness", "Sports coaching", "1-to-1 mentoring & career guidance", "Fundraising & CSR connections",
  "Event management", "Management & operations", "Accounts, finance & compliance", "Legal support",
  "HR & volunteer coordination", "Health camps (medical professionals)",
  "Environment drives (tree plantation, clean-ups)", "Community kitchen / food drives",
] as const;

export const volunteerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.union([z.literal(""), z.string().trim().email().max(150)]).optional(),
  phone: z.union([z.literal(""), z.string().trim().regex(/^[+\d ()-]{7,20}$/)]).optional(),
  mode: z.enum(["ONLINE", "OFFLINE", "BOTH"]), city: z.string().trim().max(80).optional(),
  availability: z.enum(["WEEKDAYS", "WEEKENDS", "BOTH", "FLEXIBLE"]),
  hoursPerMonth: z.enum(["<2", "2-5", "5-10", "10+"]),
  interests: z.array(z.enum(volunteerInterests)).max(23), other: z.string().trim().max(500).optional(), consent: z.literal(true),
}).refine((value) => value.email || value.phone, "Please enter an email or phone number")
  .refine((value) => value.mode === "ONLINE" || value.city, "City is required for offline volunteering");