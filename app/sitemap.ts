import { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { PROJECTS } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: "/", priority: 1.0, freq: "weekly" },
    { url: "/about", priority: 0.9, freq: "monthly" },
    { url: "/team", priority: 0.7, freq: "monthly" },
    { url: "/verticals", priority: 0.9, freq: "monthly" },
    { url: "/vision-mission", priority: 0.8, freq: "monthly" },
    { url: "/projects", priority: 0.8, freq: "weekly" },
    { url: "/impact", priority: 0.8, freq: "monthly" },
    { url: "/volunteer", priority: 0.8, freq: "monthly" },
    { url: "/donate", priority: 1.0, freq: "monthly" },
    { url: "/contact", priority: 0.7, freq: "monthly" },
    { url: "/gallery", priority: 0.6, freq: "monthly" },
    { url: "/privacy-policy", priority: 0.3, freq: "yearly" },
    { url: "/terms-and-conditions", priority: 0.3, freq: "yearly" },
    { url: "/refund-policy", priority: 0.3, freq: "yearly" },
  ];

  return [
    ...staticRoutes.map(({ url, priority, freq }) => ({
      url: `${SITE.url}${url}`,
      changeFrequency: freq as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority,
    })),
    ...PROJECTS.map((p) => ({
      url: `${SITE.url}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
