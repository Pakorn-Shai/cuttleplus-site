"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

const actionSchema = z.object({ contentId: z.string().cuid(), action: z.enum(["publish", "draft", "archive"]) });

export async function updateContentStatusAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = actionSchema.safeParse({ contentId: formData.get("contentId"), action: formData.get("action") });
  if (!parsed.success) return;
  const existing = await prisma.content.findUnique({ where: { id: parsed.data.contentId } });
  if (!existing) return;
  if (parsed.data.action === "publish" && (!existing.title.trim() || !existing.slug.trim() || !existing.plainText.trim())) return;

  await prisma.$transaction(async (tx) => {
    const status = parsed.data.action === "publish" ? "PUBLISHED" : parsed.data.action === "archive" ? "ARCHIVED" : "DRAFT";
    const content = await tx.content.update({
      where: { id: existing.id },
      data: { status, publishedAt: status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt },
    });
    if (status === "PUBLISHED") {
      const latest = await tx.contentRevision.aggregate({ where: { contentId: content.id }, _max: { revisionNumber: true } });
      await tx.contentRevision.create({ data: { contentId: content.id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, title: content.title, excerpt: content.excerpt, contentJson: content.contentJson as Prisma.InputJsonValue, contentHtml: content.contentHtml, plainText: content.plainText, createdById: owner.id, reason: "Published" } });
    }
    await tx.auditLog.create({ data: { userId: owner.id, action: `CONTENT_${status}`, entityType: "Content", entityId: content.id } });
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/admin");
  revalidatePath("/admin/content");
}
