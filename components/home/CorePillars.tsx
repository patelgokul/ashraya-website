"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { VERTICALS } from "@/lib/content";

export function CorePillars() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4">
            Main Verticals
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            ✨ A S H R A Y A ✨
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Ashraya runs its initiatives on its own name — every letter is a mission we live by.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VERTICALS.map((v, i) => (
            <motion.div
              key={v.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={`/verticals#${v.slug}`}
                className="group block h-full bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-4xl font-black text-blue-700">{v.letter}</span>
                  <span className="text-3xl">{v.icon}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{v.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.tagline}</p>
              </Link>
            </motion.div>
          ))}
          <Link
            href="/verticals"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 bg-gradient-to-br from-blue-700 to-blue-900 text-white hover:from-blue-800 transition-colors"
          >
            <span className="font-display text-lg font-bold">Explore all verticals</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
