import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildContentArtifacts, createStoredDocument, editorBlocksToReaderBlocks, mergeLearningBlocksIntoEditorBlocks, parseStoredDocument, readerBlocksToEditorBlocks } from "./document";
import { createSlug } from "./slug";
import type { ContentBlock } from "./types";
import type { LearningBlock } from "./learning-blocks";
import { assertLearningBlocksArePublicSafe } from "./learning-privacy";
export type { LearningBlock } from "./learning-blocks";

export interface EditorDraft {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  tags: string[];
  visibility: "private" | "unlisted" | "public";
  contentType: EditorContentType;
  contentStatus: string;
  editorBlocks: unknown[];
  learningBlocks: LearningBlock[];
}

export type EditorContentType = "QUICK_NOTE" | "KNOWLEDGE_NOTE" | "TUTORIAL" | "ARTICLE" | "CODE_SNIPPET" | "TROUBLESHOOTING" | "CHEAT_SHEET" | "REFERENCE" | "LEARNING_LOG" | "PROJECT_NOTE" | "CASE_STUDY" | "CHECKLIST";

export interface SaveEditorDraftInput extends Omit<EditorDraft, "contentStatus"> {
  createRevision?: boolean;
}

export interface EditorTaxonomyOptions {
  categories: { name: string; slug: string }[];
  tags: string[];
}

export interface QuickCaptureInput {
  title?: string;
  text: string;
  sourceUrl?: string;
  contentType: "note" | "code" | "link";
}

async function availableSlug(tx: Prisma.TransactionClient, requestedSlug: string) {
  const matchingSlugs = await tx.content.findMany({
    where: { OR: [{ slug: requestedSlug }, { slug: { startsWith: `${requestedSlug}-` } }] },
    select: { slug: true },
  });
  const usedSlugs = new Set(matchingSlugs.map((item) => item.slug));
  let slug = requestedSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) slug = `${requestedSlug}-${suffix++}`;
  return slug;
}

export async function getEditorTaxonomyOptions(): Promise<EditorTaxonomyOptions> {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ select: { name: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 100 }),
  ]);
  return { categories, tags: tags.map((tag) => tag.name) };
}

export async function listContentRevisions(contentId: string) {
  return prisma.contentRevision.findMany({
    where: { contentId },
    select: { id: true, revisionNumber: true, title: true, plainText: true, source: true, reason: true, createdAt: true },
    orderBy: { revisionNumber: "desc" },
  });
}

export async function restoreContentRevision(contentId: string, revisionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const [content, revision, latest] = await Promise.all([
      tx.content.findUnique({ where: { id: contentId } }),
      tx.contentRevision.findFirst({ where: { id: revisionId, contentId } }),
      tx.contentRevision.aggregate({ where: { contentId }, _max: { revisionNumber: true } }),
    ]);
    if (!content || !revision) throw new Error("REVISION_NOT_FOUND");
    const currentNumber = latest._max.revisionNumber ?? 0;
    await tx.contentRevision.create({ data: {
      contentId, revisionNumber: currentNumber + 1, title: content.title, excerpt: content.excerpt,
      contentJson: content.contentJson as Prisma.InputJsonValue, contentHtml: content.contentHtml,
      plainText: content.plainText, createdById: userId, source: "SYSTEM", reason: `Backup before restoring revision ${revision.revisionNumber}`,
    } });
    const stored = parseStoredDocument(revision.contentJson);
    const artifacts = buildContentArtifacts(stored.readerBlocks);
    const restoredDocument = createStoredDocument(artifacts.blocks, stored.editorBlocks) as unknown as Prisma.InputJsonValue;
    const restored = await tx.content.update({ where: { id: contentId }, data: {
      title: revision.title, excerpt: revision.excerpt, contentJson: restoredDocument,
      contentHtml: artifacts.html, plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
    } });
    await tx.contentRevision.create({ data: {
      contentId, revisionNumber: currentNumber + 2, title: restored.title, excerpt: restored.excerpt,
      contentJson: restoredDocument, contentHtml: artifacts.html, plainText: artifacts.plainText,
      createdById: userId, source: "RESTORE", reason: `Restored from revision ${revision.revisionNumber}`,
    } });
    await tx.auditLog.create({ data: { userId, action: "CONTENT_REVISION_RESTORED", entityType: "Content", entityId: contentId, metadataJson: { revisionId, revisionNumber: revision.revisionNumber } } });
    return restored;
  });
}

export async function getEditorDraft(id: string): Promise<EditorDraft | null> {
  const content = await prisma.content.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } } },
  });
  if (!content) return null;
  const document = parseStoredDocument(content.contentJson);
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    excerpt: content.excerpt ?? "",
    categorySlug: content.category?.slug ?? "",
    tags: content.tags.map(({ tag }) => tag.name),
    visibility: content.visibility.toLowerCase() as EditorDraft["visibility"],
    contentType: content.contentType,
    contentStatus: content.status.toLowerCase(),
    editorBlocks: mergeLearningBlocksIntoEditorBlocks(document.editorBlocks?.length ? document.editorBlocks : readerBlocksToEditorBlocks(document.readerBlocks.filter((block) => !isLearningBlock(block))), document.readerBlocks),
    learningBlocks: document.readerBlocks.filter(isLearningBlock),
  };
}

export async function saveEditorDraft(input: SaveEditorDraftInput, userId?: string) {
  const requestedSlug = createSlug(input.slug || input.title);
  if (!requestedSlug) throw new Error("INVALID_SLUG");
  const converted = editorBlocksToReaderBlocks(input.editorBlocks);
  const convertedLearningIds = new Set(converted.filter(isLearningBlock).map((block) => block.id));
  const blocks = [...converted, ...input.learningBlocks.filter((block) => !convertedLearningIds.has(block.id))];
  assertLearningBlocksArePublicSafe(blocks.filter(isLearningBlock));
  const artifacts = buildContentArtifacts(blocks);
  const plainText = artifacts.plainText;
  const document = createStoredDocument(artifacts.blocks, input.editorBlocks) as unknown as Prisma.InputJsonValue;
  const category = input.categorySlug ? await prisma.category.findUnique({ where: { slug: input.categorySlug } }) : null;
  const tagNames = [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);

  return prisma.$transaction(async (tx) => {
    const slug = input.id ? requestedSlug : await availableSlug(tx, requestedSlug);
    const previous = input.id ? await tx.content.findUnique({ where: { id: input.id }, select: { slug: true } }) : null;
    const tags = await Promise.all(tagNames.map((name) => {
      const tagSlug = createSlug(name);
      return tx.tag.upsert({ where: { slug: tagSlug }, update: { name }, create: { name, slug: tagSlug } });
    }));
    const data = {
      title: input.title.trim() || "ไม่มีชื่อ",
      slug,
      excerpt: input.excerpt.trim(),
      visibility: input.visibility.toUpperCase() as "PRIVATE" | "UNLISTED" | "PUBLIC",
      contentType: input.contentType,
      contentJson: document,
      contentHtml: artifacts.html,
      plainText,
      readingTime: Math.max(1, Math.ceil(plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: category?.id ?? null,
    };

    const content = input.id
      ? await tx.content.update({ where: { id: input.id }, data: { ...data, tags: { deleteMany: {}, create: tags.map((tag) => ({ tagId: tag.id })) } } })
      : await tx.content.create({ data: { ...data, status: "DRAFT", tags: { create: tags.map((tag) => ({ tagId: tag.id })) } } });

    if (previous && previous.slug !== content.slug) {
      const sourcePath = `/knowledge/${previous.slug}`;
      await tx.slugRedirect.upsert({
        where: { sourcePath },
        update: { targetPath: `/knowledge/${content.slug}`, statusCode: 308 },
        create: { sourcePath, targetPath: `/knowledge/${content.slug}`, statusCode: 308 },
      });
    }

    if (input.createRevision) {
      const latest = await tx.contentRevision.aggregate({ where: { contentId: content.id }, _max: { revisionNumber: true } });
      await tx.contentRevision.create({ data: {
        contentId: content.id,
        revisionNumber: (latest._max.revisionNumber ?? 0) + 1,
        title: content.title,
        excerpt: content.excerpt,
        contentJson: document,
        contentHtml: content.contentHtml,
        plainText,
        createdById: userId,
        reason: "Manual save",
      } });
    }

    await tx.auditLog.create({ data: { userId, action: input.id ? "CONTENT_UPDATED" : "CONTENT_CREATED", entityType: "Content", entityId: content.id } });
    return { id: content.id, slug: content.slug, updatedAt: content.updatedAt.toISOString() };
  });
}

function isLearningBlock(block: ContentBlock): block is LearningBlock {
  return block.type === "executable-code" || block.type === "formula-example" || block.type === "automation-script";
}

export async function createQuickCapture(input: QuickCaptureInput, userId: string) {
  const text = input.text.trim();
  if (!text) throw new Error("CAPTURE_TEXT_REQUIRED");
  const firstLine = text.split(/\r?\n/u).find((line) => line.trim())?.trim() ?? "";
  const title = input.title?.trim() || firstLine.slice(0, 120) || `Quick Capture ${new Date().toISOString().slice(0, 10)}`;
  const requestedSlug = createSlug(title) || `quick-capture-${Date.now()}`;
  const blocks = input.contentType === "code"
    ? [{ id: "capture-code", type: "code" as const, language: "text", code: text }]
    : text.split(/\r?\n\s*\r?\n/u).filter(Boolean).map((paragraph, index) => ({ id: `capture-${index + 1}`, type: "paragraph" as const, text: paragraph.trim() }));
  const artifacts = buildContentArtifacts(blocks);
  const document = createStoredDocument(artifacts.blocks, readerBlocksToEditorBlocks(artifacts.blocks)) as unknown as Prisma.InputJsonValue;
  const contentType = input.contentType === "code" ? "CODE_SNIPPET" : "QUICK_NOTE";

  return prisma.$transaction(async (tx) => {
    const slug = await availableSlug(tx, requestedSlug);
    const content = await tx.content.create({ data: {
      title,
      slug,
      excerpt: text.slice(0, 240),
      contentType,
      status: "INBOX",
      visibility: "PRIVATE",
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      sources: input.sourceUrl ? { create: { url: input.sourceUrl, sourceType: input.contentType === "link" ? "link" : "reference", accessedAt: new Date() } } : undefined,
    } });
    await tx.contentRevision.create({ data: {
      contentId: content.id,
      revisionNumber: 1,
      title: content.title,
      excerpt: content.excerpt,
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      createdById: userId,
      reason: "Quick capture",
    } });
    await tx.auditLog.create({ data: { userId, action: "CONTENT_CAPTURED", entityType: "Content", entityId: content.id } });
    return content;
  });
}
