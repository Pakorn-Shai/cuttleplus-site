import { beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { publishDueScheduledContent } from "@/core/content/scheduler";
import { prisma } from "@/lib/prisma";

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "AuditLog", "AISuggestion", "AIJob", "ContentRevision", "ContentTag",
    "SeriesItem", "CollectionItem", "ContentRelation", "Source", "Content",
    "TagAlias", "Tag", "Category", "Series", "Collection", "Media", "User",
    "ThemeActivation", "SiteSetting", "SlugRedirect", "RateLimitBucket"
    RESTART IDENTITY CASCADE`);
}

async function createScheduledContent(slug: string, scheduledAt: Date, visibility: "PRIVATE" | "UNLISTED" | "PUBLIC" = "PRIVATE") {
  return prisma.content.create({ data: {
    title: `Scheduled ${slug}`,
    slug,
    excerpt: "เกริ่น",
    status: "SCHEDULED",
    visibility,
    scheduledAt,
    contentJson: { readerBlocks: [], editorBlocks: [] } as unknown as Prisma.InputJsonValue,
    contentHtml: "<p>เนื้อหา</p>",
    plainText: "เนื้อหา",
  } });
}

beforeEach(resetDatabase);

describe("scheduled publishing integration", () => {
  it("publishes due content, flips private visibility, and records revision + audit log", async () => {
    const scheduledAt = new Date(Date.now() - 60_000); // 1 minute in the past.
    const content = await createScheduledContent("due-item", scheduledAt, "PRIVATE");

    const summary = await publishDueScheduledContent(new Date());

    expect(summary.due).toBe(1);
    expect(summary.published).toBe(1);
    expect(summary.failed).toBe(0);

    const published = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(published.status).toBe("PUBLISHED");
    expect(published.visibility).toBe("PUBLIC");
    expect(published.publishedAt?.getTime()).toBe(scheduledAt.getTime());

    const revisions = await prisma.contentRevision.findMany({ where: { contentId: content.id } });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({ source: "SYSTEM", reason: "Scheduled publish", revisionNumber: 1 });

    const auditLogs = await prisma.auditLog.findMany({ where: { action: "CONTENT_SCHEDULED_PUBLISHED" } });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].entityId).toBe(content.id);
  });

  it("keeps unlisted visibility when publishing due unlisted content", async () => {
    const scheduledAt = new Date(Date.now() - 60_000);
    const content = await createScheduledContent("due-unlisted", scheduledAt, "UNLISTED");

    await publishDueScheduledContent(new Date());

    const published = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(published.status).toBe("PUBLISHED");
    expect(published.visibility).toBe("UNLISTED");
  });

  it("does not publish content whose scheduledAt is still in the future", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour ahead.
    const content = await createScheduledContent("not-due", future, "PRIVATE");

    const summary = await publishDueScheduledContent(new Date());

    expect(summary.due).toBe(0);
    expect(summary.published).toBe(0);

    const stillScheduled = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(stillScheduled.status).toBe("SCHEDULED");
    expect(stillScheduled.publishedAt).toBeNull();
    expect(await prisma.contentRevision.count({ where: { contentId: content.id } })).toBe(0);
  });

  it("is idempotent: a second run publishes nothing for already-published items", async () => {
    const scheduledAt = new Date(Date.now() - 60_000);
    const content = await createScheduledContent("duplicate-run", scheduledAt, "PRIVATE");

    const first = await publishDueScheduledContent(new Date());
    expect(first.published).toBe(1);

    const second = await publishDueScheduledContent(new Date());
    expect(second.due).toBe(0);
    expect(second.published).toBe(0);

    // Only one revision and one audit log must exist despite two runs.
    expect(await prisma.contentRevision.count({ where: { contentId: content.id } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: "CONTENT_SCHEDULED_PUBLISHED", entityId: content.id } })).toBe(1);

    const published = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(published.status).toBe("PUBLISHED");
  });

  it("reports a failed item, keeps it scheduled for retry, and still publishes the rest", async () => {
    const scheduledAt = new Date(Date.now() - 60_000);
    const failing = await createScheduledContent("will-fail", scheduledAt, "PRIVATE");
    const healthy = await createScheduledContent("will-succeed", scheduledAt, "PRIVATE");

    const summary = await publishDueScheduledContent(new Date(), async (contentId) => {
      if (contentId === failing.id) throw new Error("SIMULATED_PUBLISH_FAILURE");
      const { publishSingleScheduledItem } = await import("@/core/content/scheduler");
      return publishSingleScheduledItem(contentId, new Date());
    });

    expect(summary.due).toBe(2);
    expect(summary.published).toBe(1);
    expect(summary.failed).toBe(1);

    const failedItem = summary.items.find((item) => item.contentId === failing.id);
    expect(failedItem?.result).toBe("failed");
    expect(failedItem?.error).toBe("SIMULATED_PUBLISH_FAILURE");

    // The failed item stays SCHEDULED so the next cron run retries it.
    const stillScheduled = await prisma.content.findUniqueOrThrow({ where: { id: failing.id } });
    expect(stillScheduled.status).toBe("SCHEDULED");

    // The healthy item was published.
    const published = await prisma.content.findUniqueOrThrow({ where: { id: healthy.id } });
    expect(published.status).toBe("PUBLISHED");
  });

  it("retries a previously failed item on the next run", async () => {
    const scheduledAt = new Date(Date.now() - 60_000);
    const content = await createScheduledContent("retry-item", scheduledAt, "PRIVATE");

    const failingRun = await publishDueScheduledContent(new Date(), async () => {
      throw new Error("TRANSIENT_FAILURE");
    });
    expect(failingRun.failed).toBe(1);
    expect((await prisma.content.findUniqueOrThrow({ where: { id: content.id } })).status).toBe("SCHEDULED");

    // Next run with the real publisher recovers the item.
    const retryRun = await publishDueScheduledContent(new Date());
    expect(retryRun.published).toBe(1);
    expect((await prisma.content.findUniqueOrThrow({ where: { id: content.id } })).status).toBe("PUBLISHED");
  });
});