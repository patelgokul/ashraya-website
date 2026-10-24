import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { TEAM } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Team",
  description: `The people behind ${SITE.name}.`,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function TeamPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
          Our Team
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">The People of {SITE.name}</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Volunteers, teachers, and organisers working across India so every person can care for society.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {TEAM.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="font-display text-xl font-bold text-gray-800">Team members will be listed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM.map((member) => (
              <article key={member.name} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white font-display text-xl font-black flex items-center justify-center mb-4">
                  {initials(member.name)}
                </div>
                <h2 className="font-display text-xl font-bold text-gray-900">{member.name}</h2>
                <p className="text-orange-600 font-medium text-sm mt-1">{member.role}</p>
                {member.bio && <p className="text-gray-600 text-sm leading-relaxed mt-3">{member.bio}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
