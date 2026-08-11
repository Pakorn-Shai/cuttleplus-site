"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

const actionSchema = z.object({ contentId: z.string().cuid(), action: z.enum(["publish", "draft", "archive", "restore"]), returnTo: z.enum(["content", "inbox"]).default("content") });

const scheduleSchema = z.object({ contentId: z.string().cuid(), scheduledAt: z.string().min(1), returnTo: z.enum(["content", "inbox"]).default("content") });

export async function updateContentStatusAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = actionSchema.safeParse({ contentId: formData.get("contentId"), action: formData.get("action"), returnTo: formData.get("returnTo") ?? "content" });
  if (!parsed.success) redirect("/admin/content?result=invalid");
  const existing = await prisma.content.findUnique({ where: { id: parsed.data.contentId } });
  if (!existing) redirect("/admin/content?result=not_found");
  if (parsed.data.action === "publish" && (!existing.title.trim() || !existing.slug.trim() || !existing.plainText.trim())) redirect("/admin/content?result=incomplete");

  await prisma.$transaction(async (tx) => {
    const status = parsed.data.action === "publish" ? "PUBLISHED" : parsed.data.action === "archive" ? "ARCHIVED" : "DRAFT";
    const content = await tx.content.update({
      where: { id: existing.id },
      data: {
        status,
        visibility: status === "PUBLISHED" && existing.visibility === "PRIVATE" ? "PUBLIC" : existing.visibility,
        publishedAt: status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt,
        // Leaving the scheduled state clears any pending schedule.
        scheduledAt: status === "PUBLISHED" ? existing.scheduledAt : null,
      },
    });
    if (status === "PUBLISHED") {
      const latest = await tx.contentRevision.aggregate({ where: { contentId: content.id }, _max: { revisionNumber: true } });
      await tx.contentRevision.create({ data: { contentId: content.id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, title: content.title, excerpt: content.excerpt, contentJson: content.contentJson as Prisma.InputJsonValue, contentHtml: content.contentHtml, plainText: content.plainText, createdById: owner.id, reason: "Published" } });
    }
    await tx.auditLog.create({ data: { userId: owner.id, action: `CONTENT_${status}`, entityType: "Content", entityId: content.id } });
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/tags");
  revalidatePath("/tags/[slug]", "page");
  revalidatePath("/series");
  revalidatePath("/series/[slug]", "page");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath(`/knowledge/${existing.slug}`);
  redirect(`/admin/${parsed.data.returnTo}?result=${parsed.data.action}`);
}

export async function setContentScheduleAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = scheduleSchema.safeParse({ contentId: formData.get("contentId"), scheduledAt: formData.get("scheduledAt"), returnTo: formData.get("returnTo") ?? "content" });
  if (!parsed.success) redirect("/admin/content?result=invalid");
  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) redirect("/admin/content?result=invalid");
  const existing = await prisma.content.findUnique({ where: { id: parsed.data.contentId } });
  if (!existing) redirect("/admin/content?result=not_found");
  if (!existing.title.trim() || !existing.slug.trim() || !existing.plainText.trim()) redirect("/admin/content?result=incomplete");

  await prisma.$transaction(async (tx) => {
    await tx.content.update({
      where: { id: existing.id },
      data: { status: "SCHEDULED", scheduledAt },
    });
    await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_SCHEDULED", entityType: "Content", entityId: existing.id, metadataJson: { scheduledAt: scheduledAt.toISOString() } } });
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/inbox");
  redirect(`/admin/${parsed.data.returnTo}?result=scheduled`);
}

export async function deleteContentAction(formData: FormData) {
  const owner = await requireOwner();
  const contentId = formData.get("contentId");
  if (!contentId || typeof contentId !== "string") redirect("/admin/content?result=invalid");
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) redirect("/admin/content?result=not_found");
  const title = content.title;
  await prisma.$transaction(async (tx) => {
    // Soft-delete: set deletedAt so it can be recovered if needed
    await tx.content.update({ where: { id: contentId }, data: { deletedAt: new Date(), status: "DELETED" as const } });
    await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_DELETED", entityType: "Content", entityId: contentId, metadataJson: { title } } });
  });
  revalidatePath("/admin/content");
  revalidatePath("/admin/inbox");
  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/sitemap.xml");
  redirect("/admin/content?result=deleted");
}

export async function duplicateContentAction(formData: FormData) {
  const owner = await requireOwner();
  const contentId = formData.get("contentId");
  if (!contentId || typeof contentId !== "string") redirect("/admin/content?result=invalid");
  const source = await prisma.content.findUnique({ where: { id: contentId }, include: { tags: { include: { tag: true } } } });
  if (!source) redirect("/admin/content?result=not_found");

  const baseSlug = `${source.slug}-duplicate`;
  const usedSlugs = new Set((await prisma.content.findMany({ where: { slug: { startsWith: baseSlug } }, select: { slug: true } })).map((c) => c.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;

  const dup = await prisma.$transaction(async (tx) => {
    const content = await tx.content.create({
      data: {
        title: `${source.title} (สำเนา)`,
        slug,
        excerpt: source.excerpt ? `[สำเนา] ${source.excerpt}` : null,
        contentType: source.contentType,
        status: "DRAFT" as const,
        visibility: "PRIVATE" as const,
        contentJson: source.contentJson as Prisma.InputJsonValue,
        contentHtml: source.contentHtml,
        plainText: source.plainText,
        readingTime: source.readingTime,
        categoryId: source.categoryId,
        tags: { create: source.tags.map(({ tag }) => ({ tagId: tag.id })) },
      },
    });
    await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_DUPLICATED", entityType: "Content", entityId: content.id, metadataJson: { sourceId: contentId, sourceTitle: source.title } } });
    return content;
  });

  revalidatePath("/admin/content");
  redirect(`/admin/content/${dup.id}/edit`);
}

export async function mergeTagsAction(formData: FormData) {
  const owner = await requireOwner();
  const sourceId = formData.get("sourceTagId");
  const targetId = formData.get("targetTagId");
  if (!sourceId || !targetId || typeof sourceId !== "string" || typeof targetId !== "string" || sourceId === targetId) redirect("/admin/tags?result=invalid_merge");
  const [source, target] = await Promise.all([
    prisma.tag.findUnique({ where: { id: sourceId } }),
    prisma.tag.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) redirect("/admin/tags?result=not_found");

  await prisma.$transaction(async (tx) => {
    // Move all content-tag relations from source to target
    const existingPairs = new Set((await tx.contentTag.findMany({ where: { tagId: targetId }, select: { contentId: true } })).map((ct) => ct.contentId));
    const sourcePairs = await tx.contentTag.findMany({ where: { tagId: sourceId } });
    for (const pair of sourcePairs) {
      if (existingPairs.has(pair.contentId)) {
        await tx.contentTag.delete({ where: { contentId_tagId: { contentId: pair.contentId, tagId: sourceId } } });
      } else {
        await tx.contentTag.update({ where: { contentId_tagId: { contentId: pair.contentId, tagId: sourceId } }, data: { tagId: targetId } });
      }
    }
    // Create alias from source → target
    await tx.tagAlias.create({ data: { tagId: targetId, alias: source.slug, normalizedAlias: source.slug.toLowerCase() } });
    await tx.tag.delete({ where: { id: sourceId } });
    await tx.auditLog.create({ data: { userId: owner.id, action: "TAG_MERGED", entityType: "Tag", entityId: targetId, metadataJson: { sourceName: source.name, sourceId, targetName: target.name } } });
  });

  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  revalidatePath("/tags/[slug]", "page");
  redirect("/admin/tags?result=merged");
}

export async function bulkUpdateContentAction(formData: FormData) {
  const owner = await requireOwner();
  const ids = formData.getAll("ids").filter((id): id is string => typeof id === "string" && id.length > 0);
  const action = formData.get("bulkAction");
  if (!ids.length || !action || typeof action !== "string") redirect("/admin/content?result=invalid");

  if (action === "delete") {
    await prisma.$transaction(async (tx) => {
      await tx.content.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date(), status: "DELETED" as const } });
      await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_BULK_DELETED", entityType: "Content", metadataJson: { count: ids.length, ids } } });
    });
  } else if (action === "archive") {
    await prisma.$transaction(async (tx) => {
      await tx.content.updateMany({ where: { id: { in: ids } }, data: { status: "ARCHIVED" as const } });
      await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_BULK_ARCHIVED", entityType: "Content", metadataJson: { count: ids.length, ids } } });
    });
  } else if (action === "publish") {
    await prisma.$transaction(async (tx) => {
      await tx.content.updateMany({ where: { id: { in: ids }, status: { in: ["DRAFT" as const, "READY" as const] } }, data: { status: "PUBLISHED" as const, publishedAt: new Date(), visibility: "PUBLIC" as const } });
      await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_BULK_PUBLISHED", entityType: "Content", metadataJson: { count: ids.length, ids } } });
    });
  } else {
    redirect("/admin/content?result=invalid");
  }

  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/knowledge");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/content?result=bulk_${action}`);
}

export async function clearContentScheduleAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = actionSchema.safeParse({ contentId: formData.get("contentId"), action: "draft", returnTo: formData.get("returnTo") ?? "content" });
  if (!parsed.success) redirect("/admin/content?result=invalid");
  const existing = await prisma.content.findUnique({ where: { id: parsed.data.contentId } });
  if (!existing) redirect("/admin/content?result=not_found");

  await prisma.$transaction(async (tx) => {
    await tx.content.update({ where: { id: existing.id }, data: { status: "DRAFT", scheduledAt: null } });
    await tx.auditLog.create({ data: { userId: owner.id, action: "CONTENT_SCHEDULE_CLEARED", entityType: "Content", entityId: existing.id } });
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/inbox");
  redirect(`/admin/${parsed.data.returnTo}?result=unscheduled`);
}

const bulkInboxSchema = z.object({ ids: z.string().min(1), action: z.enum(["draft", "archive"]) });

export async function bulkInboxAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = bulkInboxSchema.safeParse({ ids: formData.get("ids"), action: formData.get("action") });
  if (!parsed.success) redirect("/admin/inbox?result=invalid");
  const ids = parsed.data.ids.split(",").filter(Boolean);
  if (!ids.length) redirect("/admin/inbox?result=invalid");
  const status = parsed.data.action === "draft" ? "DRAFT" : "ARCHIVED";
  await prisma.$transaction(async (tx) => {
    await tx.content.updateMany({ where: { id: { in: ids }, status: "INBOX" }, data: { status } });
    await tx.auditLog.create({ data: { userId: owner.id, action: `INBOX_BULK_${status}`, entityType: "Content", entityId: ids.join(","), detail: `${ids.length} items moved to ${status}` } });
  });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  redirect(`/admin/inbox?result=bulk_${parsed.data.action}`);
}
