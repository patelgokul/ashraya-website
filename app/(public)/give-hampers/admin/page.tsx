import type { Metadata } from "next";
import { GiveHamperAdmin } from "@/components/give-hamper/GiveHamperAdmin";

export const metadata: Metadata = { title: "Give Hampers Admin", robots: { index: false, follow: false } };

export default function GiveHamperAdminPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <GiveHamperAdmin />
      </div>
    </div>
  );
}
