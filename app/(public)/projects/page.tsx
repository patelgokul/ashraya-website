import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PROJECTS } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title:       "Projects",
  description: `Explore the projects run by ${SITE.name} across India.`,
};

export default function ProjectsPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-4 border border-orange-500/30">
          Our Projects
        </span>
        <h1 className="font-display text-4xl font-bold text-white mb-3">
          Initiatives on the Ground
        </h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          From green commons to classrooms and livelihood centres, our projects turn care into change.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
