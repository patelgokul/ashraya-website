import { z } from "zod";
import { OFFICE_LOCATION_IDS } from "@/lib/give-hamper";
import { GameRegisterSchema } from "./game";

export const MAX_HAMPER_HOURS = 500;

export const GiveHamperSchema = z.object({
  officeLocation: z.enum(OFFICE_LOCATION_IDS, { errorMap: () => ({ message: "Select your office location" }) }),
  hoursTracked: z.coerce
    .number({ invalid_type_error: "Enter the hours you have tracked" })
    .gt(0, "Hours must be greater than zero")
    .max(MAX_HAMPER_HOURS, `Hours can't exceed ${MAX_HAMPER_HOURS}`)
    .multipleOf(0.25, "Use quarter hours, like 1.5 or 2.25"),
  phone: GameRegisterSchema.shape.phone.optional(),
});

export type GiveHamperInput = z.input<typeof GiveHamperSchema>;
