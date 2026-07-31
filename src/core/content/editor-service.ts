import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { blocksPlainText, createStoredDocument, editorBlocksToReaderBlocks, parseStoredDocument, readerBlocksToEditorBlocks } from "./document";
import { createSlug } from "./slug";

export interface EditorDraft {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  tags: string[];
  visibility: "private" | "unlisted" | "public";
  editorBlocks: unknown[];
}

export interface SaveEditorDraftInput extends EditorDraft {
  createRevision?: boolean;
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
    editorBlocks: document.editorBlocks?.length ? document.editorBlocks : readerBlocksToEditorBlocks(document.readerBlocks),
  };
}

export async function saveEditorDraft(input: SaveEditorDraftInput, userId?: string) {
  const slug = createSlug(input.slug || input.title);
  if (!slug) throw new Error("INVALID_SLUG");
  const readerBlocks = editorBlocksToReaderBlocks(input.editorBlocks);
  const plainText = blocksPlainText(readerBlocks);
  const document = createStoredDocument(readerBlocks, input.editorBlocks) as unknown as Prisma.InputJsonValue;
  const category = input.categorySlug ? await prisma.category.findUnique({ where: { slug: input.categorySlug } }) : null;
  const tagNames = [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);

  return prisma.$transaction(async (tx) => {
    const tags = await Promise.all(tagNames.map((name) => {
      const tagSlug = createSlug(name);
      return tx.tag.upsert({ where: { slug: tagSlug }, update: { name }, create: { name, slug: tagSlug } });
    }));
    const data = {
      title: input.title.trim() || "ไม่มีชื่อ",
      slug,
      excerpt: input.excerpt.trim(),
      visibility: input.visibility.toUpperCase() as "PRIVATE" | "UNLISTED" | "PUBLIC",
      contentJson: document,
      plainText,
      readingTime: Math.max(1, Math.ceil(plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: category?.id ?? null,
    };

    const content = input.id
      ? await tx.content.update({ where: { id: input.id }, data: { ...data, tags: { deleteMany: {}, create: tags.map((tag) => ({ tagId: tag.id })) } } })
      : await tx.content.create({ data: { ...data, status: "DRAFT", tags: { create: tags.map((tag) => ({ tagId: tag.id })) } } });

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
