import type { MetadataRoute } from "next";
import { contentRepository } from "@/core/content/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const contents = await contentRepository.listPublic();
  const staticRoutes = ["", "/knowledge", "/categories", "/search", "/about"].map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date("2026-07-30"), changeFrequency: "weekly" as const }));
  return [...staticRoutes, ...contents.map((content) => ({ url: `${baseUrl}/knowledge/${content.slug}`, lastModified: new Date(content.updatedAt), changeFrequency: "monthly" as const, priority: content.featured ? 0.8 : 0.6 }))];
}
