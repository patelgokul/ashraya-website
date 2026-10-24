import { HeroSection }   from "@/components/home/HeroSection";
import { PresenceMap }   from "@/components/home/PresenceMap";
import { AboutSection }  from "@/components/home/AboutSection";
import { CorePillars }   from "@/components/home/CorePillars";
import { ImpactStats }   from "@/components/home/ImpactStats";
import { Testimonials }  from "@/components/home/Testimonials";
import { Newsletter }    from "@/components/home/Newsletter";
import { ProjectCard }   from "@/components/projects/ProjectCard";
import { PROJECTS }      from "@/lib/content";
import { SITE }          from "@/lib/site";
import Link              from "next/link";
import { ArrowRight }    from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PresenceMap />
      <AboutSection />
      <CorePillars />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-3">
                Our Projects
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">Initiatives on the Ground</h2>
            </div>
            <Link href="/projects"
              className="hidden sm:flex items-center gap-1.5 text-blue-600 font-semibold text-sm border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      <ImpactStats />
      <Testimonials />
      <Newsletter />
    </>
  );
}
