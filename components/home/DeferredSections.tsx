"use client";

import dynamic from "next/dynamic";

// These sections animate on the server as well as the browser. Rendering them
// during the request pushes the Worker past the Free plan's 10ms CPU limit.
const HeroSection = dynamic(() => import("@/components/home/HeroSection").then((m) => m.HeroSection), { ssr: false });
const AboutSection = dynamic(() => import("@/components/home/AboutSection").then((m) => m.AboutSection), { ssr: false });
const CorePillars = dynamic(() => import("@/components/home/CorePillars").then((m) => m.CorePillars), { ssr: false });
const ImpactStats = dynamic(() => import("@/components/home/ImpactStats").then((m) => m.ImpactStats), { ssr: false });
const Testimonials = dynamic(() => import("@/components/home/Testimonials").then((m) => m.Testimonials), { ssr: false });
const Newsletter = dynamic(() => import("@/components/home/Newsletter").then((m) => m.Newsletter), { ssr: false });

export function DeferredSections({ placement }: { placement: "top" | "bottom" }) {
  if (placement === "top") {
    return (
      <>
        <HeroSection />
        <AboutSection />
        <CorePillars />
      </>
    );
  }

  return (
    <>
      <ImpactStats />
      <Testimonials />
      <Newsletter />
    </>
  );
}
