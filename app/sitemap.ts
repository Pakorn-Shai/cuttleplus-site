import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return date.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cuttleplus.com";

  const posts = await prisma.post.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
    },
  });

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: formatDate(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/blog/${category.slug}`,
    lastModified: formatDate(new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const subcategoryUrls: MetadataRoute.Sitemap = categories.flatMap(
    (category) =>
      category.subcategories.map((sub) => ({
        url: `${baseUrl}/blog/${category.slug}/${sub.slug}`,
        lastModified: formatDate(new Date()),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
  );

  const worksheets = await prisma.worksheet.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const games = await prisma.game.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const worksheetUrl: MetadataRoute.Sitemap = worksheets.length > 0 ? [{
    url: `${baseUrl}/worksheets`,
    lastModified: formatDate(new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }] : [];

  const gameUrl: MetadataRoute.Sitemap = games.length > 0 ? [{
    url: `${baseUrl}/game`,
    lastModified: formatDate(new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }] : [];

  return [
    {
      url: baseUrl,
      lastModified: formatDate(new Date()),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: formatDate(new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...categoryUrls,
    ...subcategoryUrls,
    ...postUrls,
    ...worksheetUrl,
    ...gameUrl,
  ];
}
