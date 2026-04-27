import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return date.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cuttleplus.com"}/blog/${post.slug}`,
    lastModified: formatDate(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://cuttleplus.com",
      lastModified: formatDate(new Date()),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cuttleplus.com"}/blog`,
      lastModified: formatDate(new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...postUrls,
  ];
}