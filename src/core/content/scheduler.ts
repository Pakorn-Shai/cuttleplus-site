import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Scheduled publishing.
 *
 * All comparisons are done in UTC. `Content.scheduledAt` is stored as a
 * PostgreSQL `timestamptz` and Prisma returns it as a `Date`, so there is no
 * wall-clock ambiguity: a content item is due when `scheduledAt <= now`.
 *
 * The job is idempotent and safe to re-run (cron retry, overlapping runs):
 * each item is claimed with an atomic `updateMany` guarded by
 * `status = "SCHEDULED"`, so a second run — or a concurrent run — can never
 * publish the same item twice. Items that fail are reported and stay in the
 * `SCHEDULED` state, so the next run retries them automatically.
 */

export interface ScheduledPublishItem {
  contentId: string;
  slug: string;
  result: "published" | "skipped" | "failed";
  error?: string;
}

export interface ScheduledPublishSummary {
  /** ISO-8601 UTC timestamp of this run. */
  runAt: string;
  due: number;
  published: number;
  skipped: number;
  failed: number;
  items: ScheduledPublishItem[];
}

export type PublishScheduledItem = (contentId: string, now: Date) => Promise<"published" | "skipped">;

export async function publishDueScheduledContent(
  now: Date = new Date(),
  publishItem: PublishScheduledItem = publishSingleScheduledItem,
): Promise<ScheduledPublishSummary> {
  const dueItems = await prisma.content.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now }, deletedAt: null },
    select: { id: true, slug: true },
    orderBy: { scheduledAt: "asc" },
  });

  const items: ScheduledPublishItem[] = [];
  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of dueItems) {
    try {
      const result = await publishItem(item.id, now);
      if (result === "published") published += 1;
      else skipped += 1;
      items.push({ contentId: item.id, slug: item.slug, result });
    } catch (error) {
      failed += 1;
      items.push({
        contentId: item.id,
        slug: item.slug,
        result: "failed",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
    }
  }

  return { runAt: now.toISOString(), due: dueItems.length, published, skipped, failed, items };
}

export async function publishSingleScheduledItem(contentId: string, now: Date): Promise<"published" | "skipped"> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.content.findUnique({ where: { id: contentId } });
    // Not-due or state changed guard: only publish items that are still
    // SCHEDULED and whose scheduledAt has passed.
    if (!current || current.status !== "SCHEDULED" || !current.scheduledAt || current.scheduledAt > now || current.deletedAt) {
      return "skipped";
    }

    const visibility = current.visibility === "PRIVATE" ? "PUBLIC" : current.visibility;
    const publishedAt = current.scheduledAt;

    // Atomic claim: only one transaction can flip a SCHEDULED row. A
    // concurrent or repeated run sees count === 0 and skips.
    const claimed = await tx.content.updateMany({
      where: { id: contentId, status: "SCHEDULED" },
      data: { status: "PUBLISHED", visibility, publishedAt },
    });
    if (claimed.count === 0) return "skipped";

    const latest = await tx.contentRevision.aggregate({ where: { contentId }, _max: { revisionNumber: true } });
    await tx.contentRevision.create({
      data: {
        contentId,
        revisionNumber: (latest._max.revisionNumber ?? 0) + 1,
        title: current.title,
        excerpt: current.excerpt,
        contentJson: current.contentJson as Prisma.InputJsonValue,
        contentHtml: current.contentHtml,
        plainText: current.plainText,
        source: "SYSTEM",
        reason: "Scheduled publish",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CONTENT_SCHEDULED_PUBLISHED",
        entityType: "Content",
        entityId: contentId,
        metadataJson: {
          scheduledAt: current.scheduledAt.toISOString(),
          publishedAt: publishedAt.toISOString(),
        },
      },
    });

    return "published";
  });
}