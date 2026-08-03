import type { MetadataRoute } from "next";
import { contentRepository } from "@/core/content/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [contents, tags, series, collections] = await Promise.all([contentRepository.listPublic(), contentRepository.listPublicTags(), contentRepository.listPublicSeries(), contentRepository.listPublicCollections()]);
  const staticRoutes = ["", "/knowledge", "/categories", "/tags", "/series", "/collections", "/search", "/about"].map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date("2026-07-30"), changeFrequency: "weekly" as const }));
  return [
    ...staticRoutes,
    ...tags.map((tag) => ({ url: `${baseUrl}/tags/${tag.slug}`, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...series.map((item) => ({ url: `${baseUrl}/series/${item.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...collections.map((item) => ({ url: `${baseUrl}/collections/${item.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...contents.map((content) => ({ url: `${baseUrl}/knowledge/${content.slug}`, lastModified: new Date(content.updatedAt), changeFrequency: "monthly" as const, priority: content.featured ? 0.8 : 0.6 })),
  ];
}
