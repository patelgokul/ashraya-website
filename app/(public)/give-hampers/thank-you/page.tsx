import type { Metadata } from "next";
import { GiveHamperThanks } from "@/components/give-hamper/GiveHamperThanks";

export const metadata: Metadata = {
  title: "Thank You | Give Hampers",
  robots: { index: false },
};

export default function GiveHamperThankYouPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <GiveHamperThanks />
      </div>
    </div>
  );
}
