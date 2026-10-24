import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { VERTICALS } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title:       "ASHRAYA Verticals",
  description: `The seven verticals of ${SITE.name}: Aarogya, Shiksha, Harit Prakriti evam Pashu Seva, Rajarishi, Aatm-nirbhar Nari Shakti, Yatra Nasha Mukti Ki, and Anna Seva, Aashirvad Seva.`,
};

export default function VerticalsPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
          Our Work
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">✨ A S H R A Y A ✨</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Ashraya runs its initiatives on its own name. Each letter stands for a mission that serves society.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {VERTICALS.map((v) => (
            <a
              key={v.slug}
              href={`#${v.slug}`}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-colors"
            >
              <span className="font-bold text-orange-300">{v.letter}</span> · {v.name}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        {VERTICALS.map((v) => (
          <section
            key={v.slug}
            id={v.slug}
            className="scroll-mt-24 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8"
          >
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-display text-3xl font-black">
                {v.letter}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  {v.name} <span className="ml-1">{v.icon}</span>
                </h2>
                <p className="text-orange-600 font-medium mt-1">{v.tagline}</p>
                <p className="text-gray-600 leading-relaxed mt-3">{v.intro}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {v.activities.map((a) => (
                <div key={a.title} className="flex gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-3xl p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Be part of the change</h2>
          <p className="text-gray-600 mb-5">Our work and events are open to everyone who wants to build a more empathetic society.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/volunteer" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm">
              Become a Volunteer
            </Link>
            <Link href="/donate" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl text-sm">
              Donate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
