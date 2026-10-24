"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Users, ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { HERO_STATS } from "@/lib/content";

const slides = [
  {
    heading: "Care. Connect. Change.",
    subheading: `${SITE.motto}. We work for a joyous and healthy world where people live in harmony and future generations inherit an ideal environment.`,
    cta: "Explore Our Work",
    ctaHref: "/verticals",
    highlight: "Connect.",
    image: "/hero/slide1.jpg",
  },
  {
    heading: "Seven Paths to a Better Society",
    subheading: "Health, education, environment, youth, women, freedom from addiction, and food & elder care — every letter of ASHRAYA is a mission.",
    cta: "Discover ASHRAYA",
    ctaHref: "/verticals",
    highlight: "Seven",
    image: "/hero/slide2.jpg",
  },
  {
    heading: "Join 500+ Volunteers Creating Impact",
    subheading: "One hour a day, one day a week, a month, or a year — give what you can. Every bit of your time changes a life.",
    cta: "Become a Volunteer",
    ctaHref: "/volunteer",
    highlight: "500+",
    image: "/hero/slide3.jpg",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden min-h-[600px] flex flex-col">
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 z-10 bg-slate-900/65" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex-1 flex flex-col justify-center py-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {SITE.name}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={`heading-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              {slide.heading.split(" ").map((word, i) =>
                word === slide.highlight ? (
                  <span key={i} className="text-orange-400">{word} </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-200 text-lg leading-relaxed mb-8 max-w-xl"
            >
              {slide.subheading}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`cta-${current}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ArrowRight className="w-4 h-4" /> {slide.cta}
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-6 py-3 rounded-xl border border-white/30 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm"
              >
                <Heart className="w-4 h-4" /> Donate
              </Link>
              <Link
                href="/volunteer"
                className="inline-flex items-center gap-2 text-gray-200 hover:text-white font-medium px-4 py-3 transition-colors"
              >
                <Users className="w-4 h-4" /> Volunteer
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 mt-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-orange-400" : "w-4 bg-white/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {HERO_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
