import Link from "next/link";
import type { Metadata } from "next";
import { Target } from "lucide-react";
import { ImpactStats } from "@/components/home/ImpactStats";
import { SITE } from "@/lib/site";
import { VISION_2030 } from "@/lib/content";

export const metadata: Metadata = {
  title:       "Impact",
  description: `See the impact ${SITE.name} creates across India.`,
};

export default function ImpactPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
          Our Impact
        </span>
        <h1 className="font-display text-4xl font-bold text-white mb-3">Measuring What Matters</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Centres, libraries, Jan Sewa Kendras, and community kitchens — creating an impact in the lives of many.
        </p>
      </div>

      <ImpactStats />

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Target className="w-6 h-6 text-orange-500" /> Where We Are Headed by 2030
          </h2>
          <p className="text-gray-600 mb-6">{VISION_2030.headline}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VISION_2030.goals.map((goal) => (
              <div key={goal} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-gray-700 font-medium">
                {goal}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/volunteer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl text-sm">
              Help Us Get There
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
