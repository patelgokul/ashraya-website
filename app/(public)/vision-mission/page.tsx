import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { VISION_2030 } from "@/lib/content";

export const metadata: Metadata = {
  title: "Vision & Mission",
  description: `The vision, mission, and 2030 goals of ${SITE.name}.`,
};

export default function VisionMissionPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-20 px-4 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Vision & Mission</h1>
        <p className="text-gray-300 max-w-xl mx-auto">The north star that guides every centre, campaign, and volunteer at {SITE.name}.</p>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 sm:p-12 border border-blue-200">
            <div className="text-5xl mb-5">🌟</div>
            <h2 className="font-display text-3xl font-bold text-blue-900 mb-4">Our Vision</h2>
            <p className="text-blue-800 text-lg leading-relaxed">
              For all of us to realise that each individual should care for society — building a
              joyous and healthy world where people live in harmony, knowledge reaches every level,
              and future generations inherit an ideal environment.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 sm:p-12 border border-orange-200">
            <div className="text-5xl mb-5">🎯</div>
            <h2 className="font-display text-3xl font-bold text-orange-900 mb-4">Our Mission</h2>
            <p className="text-orange-900 text-lg leading-relaxed">
              Our mission is our motto: <strong>&ldquo;{SITE.motto}&rdquo;</strong>. Through health,
              education, environment, youth leadership, women empowerment, de-addiction, and food &
              elder care, we uplift and empower communities across India.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Our Vision by 2030</h2>
            <p className="text-gray-600 mb-6">{VISION_2030.headline}</p>
            <div className="space-y-4">
              {VISION_2030.goals.map((goal, i) => (
                <div key={goal} className="flex gap-5 items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="font-display text-2xl font-black text-orange-400 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-gray-700 font-medium">{goal}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-blue-800 font-semibold italic mt-8">
              &ldquo;Creating an impact in the lives of many…&rdquo;
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
