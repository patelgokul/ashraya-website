import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100">
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
        <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 text-blue-700">
          {project.category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-gray-900 text-lg mb-1">{project.title}</h3>
        <p className="text-sm font-medium text-orange-600 mb-3">{project.tagline}</p>
        <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{project.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {project.metrics.map((m) => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-display font-bold text-blue-700 text-sm">{m.value}</div>
              <div className="text-xs text-gray-400">{m.label}</div>
            </div>
          ))}
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="block text-center border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          View Project →
        </Link>
      </div>
    </div>
  );
}
