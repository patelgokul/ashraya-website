import type { Metadata } from "next";
import { GiveHamper } from "@/components/give-hamper/GiveHamper";

export const metadata: Metadata = {
  title: "Give Hampers",
  description: "A Diwali of Giving. Paint the pieces in your ĀSHRAYA × Microsoft Give Hamper and help bring smiles to children and communities.",
};

export default function GiveHampersPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">ĀSHRAYA × Microsoft · Give Hamper</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">A Diwali of Giving</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-300 sm:text-base">
            Your little kit. A big difference. Paint the pieces inside and help bring smiles to children and communities.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <GiveHamper />
      </div>
    </div>
  );
}
