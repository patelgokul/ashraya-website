import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { PROJECTS, getProject } from "@/lib/content";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const project = getProject(params.slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline };
}

export default function ProjectDetailPage({ params }: Props) {
  const project = getProject(params.slug);
  if (!project) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-5xl mx-auto text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>{" / "}
          <Link href="/projects" className="hover:text-blue-600">Projects</Link>{" / "}
          <span className="text-gray-800">{project.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 mb-6">
          <Image src={project.coverImage} alt={project.title} fill priority className="object-cover" sizes="100vw" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{project.category}</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-1">{project.title}</h1>
              <p className="text-orange-600 font-medium mb-4">{project.tagline}</p>
              <p className="text-gray-600 leading-relaxed">{project.description}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">What We Do</h2>
              <ul className="space-y-3">
                {project.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Impact
              </h2>
              <div className="space-y-3">
                {project.metrics.map((m) => (
                  <div key={m.label} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-100">
                    <div className="font-display text-2xl font-bold text-blue-700">{m.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/donate"
              className="block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-center text-sm transition-colors"
            >
              ❤ Support This Project
            </Link>
            <Link
              href="/volunteer"
              className="block border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold py-3 rounded-xl text-center text-sm transition-colors"
            >
              Volunteer With Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
