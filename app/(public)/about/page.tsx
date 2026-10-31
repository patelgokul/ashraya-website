import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { VERTICALS } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description: `${SITE.legalName} — registered non-government company, our mission, directors, and the work of ${SITE.name}.`,
};

const MISSION =
  "Ashraya Vikas Association is committed to empowering underprivileged communities across India by providing compassionate, inclusive services that tackle the root causes of inequality. We promote welfare through non-institutional solutions, family support, and community partnerships, ensuring every individual—regardless of background—can achieve a dignified and self-reliant life.";

const REGISTRATION = [
  { label: "Registered name", value: "Ashraya Vikas Association" },
  { label: "CIN", value: "U88900KA2025NPL206777" },
  {
    label: "Registered office",
    value:
      "WeWork Vaishnavi Signature, No. 78/9, Outer Ring Road, Bellandur, Bangalore South, Karnataka 560103, India",
  },
  { label: "Registered email", value: "office@ashrayavikas.in" },
];

const DIRECTORS = [
  { name: "Shreyash Bhaskar Patil", role: "Director" },
  { name: "Hemant Chandrashekhar Wade", role: "Director" },
];

const VALUES = [
  { icon: "🤲", title: "Selflessness",            desc: "Serving others without expecting anything in return." },
  { icon: "💛", title: "Compassion",              desc: "Caring for every person, animal, and plant as part of one family." },
  { icon: "🗣️", title: "Soft Skills",             desc: "Service builds empathy, communication, and teamwork." },
  { icon: "🌟", title: "Leadership",              desc: "Bringing out the leader within every volunteer and youth." },
  { icon: "😊", title: "Happiness & Satisfaction", desc: "The deep fulfilment that comes from helping others." },
  { icon: "🎁", title: "The Joy of Giving",        desc: "Giving time, wealth, intelligence, and words for the good of all." },
];

export default function AboutPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
            About Us
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            {SITE.tagline}
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">&ldquo;{SITE.motto}&rdquo;</p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
          <div className="text-gray-600 text-lg leading-relaxed space-y-4">
            <p>
              <strong className="text-gray-900">{SITE.legalName}</strong> is the registered name of {SITE.name}.
              We believe that each individual should care for society.
              Our work and events are open to everyone who is passionate about creating a better,
              more empathetic society.
            </p>
            <p>
              We strive toward a joyous and healthy world, where people live in harmony while
              providing an ideal environment for the generations to come. We believe it is possible
              to create a world that knows no suffering — one where knowledge reaches every level of society.
            </p>
            <p>
              Ashraya is present at 27 locations across 18 cities and 13 states and union territories,
              running centres, libraries, Jan Sewa Kendras, and community kitchens.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-800 text-lg leading-relaxed">{MISSION}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Registered Organisation</h2>
          <p className="text-gray-500 mb-8">
            Details as registered with the Ministry of Corporate Affairs.
          </p>
          <dl className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {REGISTRATION.map((item) => (
              <div key={item.label} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 py-4">
                <dt className="text-sm font-semibold text-gray-500">{item.label}</dt>
                <dd className="sm:col-span-2 text-gray-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Board of Directors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
            {DIRECTORS.map((director) => (
              <div key={director.name} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-display text-xl font-bold text-gray-900">{director.name}</h3>
                <p className="text-blue-700 font-semibold mt-1">{director.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-gray-900 text-center mb-3">What ASHRAYA Stands For</h2>
          <p className="text-gray-500 text-center mb-10">Every letter of our name is a mission.</p>
          <div className="space-y-3">
            {VERTICALS.map((v) => (
              <Link
                key={v.slug}
                href={`/verticals#${v.slug}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <span className="w-11 h-11 flex-shrink-0 rounded-xl bg-blue-700 text-white font-display text-xl font-black flex items-center justify-center">
                  {v.letter}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{v.name} <span>{v.icon}</span></div>
                  <div className="text-sm text-gray-500">{v.tagline}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900">Why Social Service?</h2>
            <p className="text-gray-500 mt-2">What every volunteer gains by serving society.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
