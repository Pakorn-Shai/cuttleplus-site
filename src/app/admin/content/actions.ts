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
