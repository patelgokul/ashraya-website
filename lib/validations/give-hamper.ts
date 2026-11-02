import { z } from "zod";
import { GameRegisterSchema, officeLocationSchema } from "./game";

export const MAX_HAMPER_HOURS = 500;

const hoursSchema = z.coerce
  .number({ invalid_type_error: "Enter your committed hours" })
  .gt(0, "Hours must be greater than zero")
  .max(MAX_HAMPER_HOURS, `Hours can't exceed ${MAX_HAMPER_HOURS}`)
  .multipleOf(0.25, "Use quarter hours, like 1.5 or 2.25");

export const GiveHamperSchema = z.object({
  officeLocation: officeLocationSchema.optional(),
  hoursTracked: hoursSchema,
  phone: GameRegisterSchema.shape.phone.optional(),
});

export const AdminHamperHoursSchema = z.object({
  alias: z.string().trim().min(1).max(20),
  id: z.string().trim().min(1).max(64).optional(),
  hoursTracked: hoursSchema,
  remark: z
    .string()
    .trim()
    .max(500, "Remark can't exceed 500 characters")
    .nullish()
    .transform((value) => value || null),
});

export type GiveHamperInput = z.input<typeof GiveHamperSchema>;
