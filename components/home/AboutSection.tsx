"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Globe } from "lucide-react";
import { SITE } from "@/lib/site";

export function AboutSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden h-80">
              <img
                src="/images/about-ngo.jpg"
                alt={`${SITE.name} community work`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/20" />

              <div className="absolute top-4 right-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-gray-700">500+ Volunteers</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">13 States & UTs</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4">
              Who We Are
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Every Individual<br />
              <span className="text-blue-700">Should Care for Society</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our vision is for all of us to realise that each individual should care for society.
              Our work and events are open to everyone who is passionate about creating a better,
              more empathetic society.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We strive for a joyous and healthy world, where people live in harmony and future
              generations inherit an ideal environment — a world that knows no suffering, where
              knowledge reaches every level of society.
            </p>
            <p className="text-blue-800 font-semibold italic mb-6">&ldquo;{SITE.motto}&rdquo;</p>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-blue-700 font-semibold border-2 border-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200"
            >
              Read Our Story <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
