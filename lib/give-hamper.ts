const env = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export type HamperCity = "NOIDA" | "BENGALURU" | "HYDERABAD";

export const OFFICE_LOCATIONS = [
  { id: "noida-kp-towers", label: "Noida – KP Towers", city: "NOIDA" },
  { id: "noida-sovereign", label: "Noida – Sovereign Building", city: "NOIDA" },
  { id: "bengaluru-ferns-prestige", label: "Bengaluru – Prestige Ferns Galaxy", city: "BENGALURU" },
  { id: "bengaluru-luxur", label: "Bengaluru – Luxur", city: "BENGALURU" },
  { id: "hyderabad-main-campus", label: "Hyderabad – Microsoft Main Campus", city: "HYDERABAD" },
  { id: "hyderabad-phoenix", label: "Hyderabad – Phoenix Building", city: "HYDERABAD" },
] as const satisfies readonly { id: string; label: string; city: HamperCity }[];

export type OfficeLocationId = (typeof OFFICE_LOCATIONS)[number]["id"];

export const OFFICE_LOCATION_IDS = OFFICE_LOCATIONS.map((office) => office.id) as [OfficeLocationId, ...OfficeLocationId[]];

// WhatsApp groups are city-wide, so both offices in a city share one link.
export const CITY_GROUPS: Record<HamperCity, { name: string; whatsappUrl: string }> = {
  NOIDA: { name: "Noida", whatsappUrl: env(process.env.NEXT_PUBLIC_WHATSAPP_NOIDA, "https://chat.whatsapp.com/GX8cq4syWhKAARJljXZ07n") },
  BENGALURU: { name: "Bengaluru", whatsappUrl: env(process.env.NEXT_PUBLIC_WHATSAPP_BENGALURU, "https://chat.whatsapp.com/EjDTEChSNWALd25T40ajX1") },
  HYDERABAD: { name: "Hyderabad", whatsappUrl: env(process.env.NEXT_PUBLIC_WHATSAPP_HYDERABAD, "https://chat.whatsapp.com/FpCIpMWMRZHHH735wXAcxk") },
};

export const GIVE_HAMPER = {
  benevityTimeUrl: env(
    process.env.NEXT_PUBLIC_BENEVITY_TIME_URL,
    "https://microsoft.benevity.org/cause/356-5501917747757_1ec1/project/60EX9W3L5D",
  ),
  kitImage: "/images/give-hamper/diwali-kit.png",
  kitPdf: env(process.env.NEXT_PUBLIC_GIVE_HAMPER_KIT_PDF, "/images/give-hamper/diwali-kit.pdf"),
};

export const TREASURE_HUNT = {
  enabled: env(process.env.NEXT_PUBLIC_TREASURE_HUNT_ENABLED, "true") === "true",
  date: env(process.env.NEXT_PUBLIC_TREASURE_HUNT_DATE, "This Wednesday"),
  time: env(process.env.NEXT_PUBLIC_TREASURE_HUNT_TIME, "To be announced"),
};

export function officeById(id: string) {
  return OFFICE_LOCATIONS.find((office) => office.id === id) ?? null;
}

export type GiveHamperState = {
  me: { alias: string; name: string; phone: string | null; officeLocation: OfficeLocationId | null } | null;
  hamper: {
    hoursTracked: number;
    acceptedAt: string;
    updatedAt: string;
    treasureHuntAt: string | null;
  } | null;
};

export type HamperAdminRow = {
  alias: string;
  name: string;
  registeredAt: string;
  officeLocation: OfficeLocationId | null;
  hoursTracked: number | null;
};
