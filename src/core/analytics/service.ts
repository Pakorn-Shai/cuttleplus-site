import "server-only";

import { prisma } from "@/lib/prisma";

export interface PageViewSummary {
  totalViews: number;
  todayViews: number;
  topPaths: { path: string; views: number }[];
  viewsByDay: { date: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
}

/**
 * Track a page view. Only tracks public paths, ignores admin/API routes.
 * Does not store IP addresses, user agents, or any PII.
 */
export async function trackPageView(path: string, referrer?: string): Promise<void> {
  // Only track public-facing pages
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/login") || path.startsWith("/_next")) {
    return;
  }

  // Normalize path: strip trailing slash, lowercase
  const normalizedPath = path.replace(/\/$/, "") || "/";

  // Strip query parameters from referrer
  const normalizedReferrer = referrer
    ? (() => {
        try {
          const url = new URL(referrer);
          return url.hostname || null;
        } catch {
          return null;
        }
      })()
    : null;

  await prisma.pageView.create({
    data: {
      path: normalizedPath,
      referrer: normalizedReferrer,
      date: new Date(),
    },
  });
}

/**
 * Get analytics summary for the admin dashboard.
 */
export async function getPageViewSummary(days = 30): Promise<PageViewSummary> {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalViews, todayViews, topPaths, viewsByDay, topReferrers] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { date: { gte: todayStart } } }),
    prisma.pageView.groupBy({ by: ["path"], _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 20, where: { date: { gte: since } } }),
    prisma.pageView.findMany({
      where: { date: { gte: since } },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    prisma.pageView.groupBy({ by: ["referrer"], _count: { referrer: true }, orderBy: { _count: { referrer: "desc" } }, take: 10, where: { date: { gte: since }, referrer: { not: null } } }),
  ]);

  // Aggregate views by day
  const dayMap = new Map<string, number>();
  for (const view of viewsByDay) {
    const day = view.date.toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const dailyViews = Array.from(dayMap.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalViews,
    todayViews,
    topPaths: topPaths.map((p) => ({ path: p.path, views: p._count.path })),
    viewsByDay: dailyViews,
    topReferrers: topReferrers
      .filter((r) => r.referrer !== null)
      .map((r) => ({ referrer: r.referrer!, views: r._count.referrer })),
  };
}

/**
 * Get page views for a specific content path.
 */
export async function getContentPageViews(slug: string, days = 30): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.pageView.count({
    where: {
      path: `/knowledge/${slug}`,
      date: { gte: since },
    },
  });
}