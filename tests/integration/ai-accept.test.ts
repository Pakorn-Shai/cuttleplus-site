import { beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { contentSnapshotHash } from "@/core/ai/content-hash";
import { reviewSuggestion } from "@/core/ai/service";
import { createStoredDocument, parseStoredDocument, readerBlocksToEditorBlocks } from "@/core/content/document";
import { getEditorDraft } from "@/core/content/editor-service";
import { prisma } from "@/lib/prisma";

const originalBlocks = [{ id: "intro", type: "paragraph" as const, text: "ข้อความก่อนใช้ AI" }];
const originalDocument = createStoredDocument(originalBlocks, readerBlocksToEditorBlocks(originalBlocks));

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "AuditLog", "AISuggestion", "AIJob", "ContentRevision", "ContentTag",
    "SeriesItem", "CollectionItem", "ContentRelation", "Source", "Content",
    "TagAlias", "Tag", "Category", "Series", "Collection", "Media", "User",
    "ThemeActivation", "SiteSetting", "SlugRedirect", "RateLimitBucket"
    RESTART IDENTITY CASCADE`);
}

async function createFixture() {
  const owner = await prisma.user.create({ data: { email: "integration-owner@example.com", name: "Integration Owner" } });
  const content = await prisma.content.create({ data: {
    title: "ชื่อเดิม",
    slug: "ai-accept-integration",
    excerpt: "เกริ่นเดิม",
    status: "DRAFT",
    visibility: "PRIVATE",
    contentJson: originalDocument as unknown as Prisma.InputJsonValue,
    contentHtml: "<p>ข้อความก่อนใช้ AI</p>",
    plainText: "ข้อความก่อนใช้ AI",
  } });
  const job = await prisma.aIJob.create({ data: {
    contentId: content.id,
    jobType: "READABILITY",
    provider: "fixture",
    model: "deterministic",
    promptVersion: "integration-v1",
    inputHash: contentSnapshotHash(content),
    status: "COMPLETED",
    completedAt: new Date(),
  } });
  const suggestion = await prisma.aISuggestion.create({ data: {
    contentId: content.id,
    jobId: job.id,
    suggestionType: "READABILITY",
    originalJson: { title: content.title, excerpt: content.excerpt ?? "", blocks: originalBlocks },
    suggestedJson: {
      title: "ชื่อใหม่จาก AI",
      excerpt: "เกริ่นใหม่ที่ชัดขึ้น",
      summary: "fixture ที่ไม่เรียก provider",
      changes: [{
        blockId: "intro",
        replacementText: "ข้อความใหม่จาก AI",
        replacementTitle: null,
        replacementItems: null,
        reason: "อ่านง่ายขึ้น",
      }],
    },
  } });
  return { owner, content, suggestion };
}

beforeEach(resetDatabase);

describe("AI suggestion acceptance integration", () => {
  it("persists accepted content, the previous revision, and Editor/Preview artifacts atomically", async () => {
    const { owner, content, suggestion } = await createFixture();

    await reviewSuggestion({ suggestionId: suggestion.id, decision: "accept", userId: owner.id });

    const [saved, reviewed, revisions, editorDraft] = await Promise.all([
      prisma.content.findUniqueOrThrow({ where: { id: content.id } }),
      prisma.aISuggestion.findUniqueOrThrow({ where: { id: suggestion.id } }),
      prisma.contentRevision.findMany({ where: { contentId: content.id }, orderBy: { revisionNumber: "asc" } }),
      getEditorDraft(content.id),
    ]);

    expect(saved).toMatchObject({ title: "ชื่อใหม่จาก AI", excerpt: "เกริ่นใหม่ที่ชัดขึ้น", plainText: "ข้อความใหม่จาก AI" });
    expect(saved.contentHtml).toContain("ข้อความใหม่จาก AI");
    expect(parseStoredDocument(saved.contentJson).readerBlocks[0]).toMatchObject({ text: "ข้อความใหม่จาก AI" });
    expect(editorDraft?.editorBlocks).toEqual(readerBlocksToEditorBlocks(parseStoredDocument(saved.contentJson).readerBlocks));
    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({ title: "ชื่อเดิม", excerpt: "เกริ่นเดิม", plainText: "ข้อความก่อนใช้ AI", source: "AI" });
    expect(reviewed).toMatchObject({ status: "ACCEPTED", revisionId: revisions[0].id });
    expect(reviewed.reviewedAt).toBeInstanceOf(Date);
  });

  it("rejects an accept when content changed after generation", async () => {
    const { owner, content, suggestion } = await createFixture();
    await prisma.content.update({ where: { id: content.id }, data: { title: "ผู้ใช้แก้หลัง Generate" } });

    await expect(reviewSuggestion({ suggestionId: suggestion.id, decision: "accept", userId: owner.id })).rejects.toThrow("CONTENT_CHANGED");

    expect(await prisma.aISuggestion.findUniqueOrThrow({ where: { id: suggestion.id } })).toMatchObject({ status: "PENDING", reviewedAt: null });
    expect(await prisma.contentRevision.count({ where: { contentId: content.id } })).toBe(0);
  });

  it("rolls the whole transaction back when a dependent write fails", async () => {
    const { content, suggestion } = await createFixture();

    await expect(reviewSuggestion({ suggestionId: suggestion.id, decision: "accept", userId: "missing-owner" })).rejects.toThrow();

    expect(await prisma.content.findUniqueOrThrow({ where: { id: content.id } })).toMatchObject({ title: "ชื่อเดิม", plainText: "ข้อความก่อนใช้ AI" });
    expect(await prisma.aISuggestion.findUniqueOrThrow({ where: { id: suggestion.id } })).toMatchObject({ status: "PENDING", reviewedAt: null });
    expect(await prisma.contentRevision.count({ where: { contentId: content.id } })).toBe(0);
  });
});

