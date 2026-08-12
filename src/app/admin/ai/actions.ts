"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { reviewSuggestion } from "@/core/ai/service";
import { requireOwner } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { readabilitySuggestionSchema } from "@/core/ai/suggestion";

const reviewSchema = z.object({ suggestionId: z.string().cuid(), decision: z.enum(["accept", "reject"]), blockIds: z.string().optional() });

export async function reviewSuggestionAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = reviewSchema.safeParse({ suggestionId: formData.get("suggestionId"), decision: formData.get("decision"), blockIds: formData.get("blockIds") });
  if (!parsed.success) return;
  const blockIds = parsed.data.blockIds ? parsed.data.blockIds.split(",").filter(Boolean) : undefined;
  let reviewed: Awaited<ReturnType<typeof reviewSuggestion>>;
  try {
    reviewed = await reviewSuggestion({ suggestionId: parsed.data.suggestionId, decision: parsed.data.decision, userId: owner.id, blockIds });
  } catch (error) {
    if (error instanceof Error && error.message === "CONTENT_CHANGED") redirect("/admin/ai?error=content_changed");
    throw error;
  }
  revalidatePath("/admin/ai");
  revalidatePath("/admin/content");
  revalidatePath("/knowledge");
  revalidatePath("/tags");
  revalidatePath("/tags/[slug]", "page");
  revalidatePath("/series");
  revalidatePath("/series/[slug]", "page");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  if (parsed.data.decision === "accept") {
    revalidatePath(`/admin/content/${reviewed.contentId}/edit`);
    revalidatePath(`/admin/content/${reviewed.contentId}/preview`);
    revalidatePath(`/admin/content/${reviewed.contentId}/revisions`);
    revalidatePath(`/knowledge/${reviewed.slug}`);
  }
  redirect(`/admin/ai?reviewed=${parsed.data.decision}` as Route);
}

const editSuggestionSchema = z.object({
  suggestionId: z.string().cuid(),
  blockId: z.string().min(1),
  field: z.enum(["replacementText", "replacementTitle", "replacementItems"]),
  value: z.string(),
});

export async function editSuggestionAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = editSuggestionSchema.safeParse({
    suggestionId: formData.get("suggestionId"),
    blockId: formData.get("blockId"),
    field: formData.get("field"),
    value: formData.get("value"),
  });
  if (!parsed.success) return;
  const suggestion = await prisma.aISuggestion.findUnique({ where: { id: parsed.data.suggestionId } });
  if (!suggestion || suggestion.status !== "PENDING") return;
  const parsed2 = readabilitySuggestionSchema.safeParse(suggestion.suggestedJson);
  if (!parsed2.success) return;
  const updated = { ...parsed2.data };
  const change = updated.changes.find((c) => c.blockId === parsed.data.blockId);
  if (!change) return;
  if (parsed.data.field === "replacementItems") {
    change.replacementItems = parsed.data.value ? parsed.data.value.split("\n").filter(Boolean) : null;
  } else if (parsed.data.field === "replacementTitle") {
    change.replacementTitle = parsed.data.value || null;
  } else {
    change.replacementText = parsed.data.value || null;
  }
  await prisma.aISuggestion.update({ where: { id: parsed.data.suggestionId }, data: { suggestedJson: updated as unknown as Prisma.InputJsonValue } });
  await prisma.auditLog.create({ data: { userId: owner.id, action: "AI_SUGGESTION_EDITED", entityType: "AISuggestion", entityId: parsed.data.suggestionId } });
  revalidatePath("/admin/ai");
}

export async function restoreSuggestionAction(formData: FormData) {
  const owner = await requireOwner();
  const suggestionId = formData.get("suggestionId");
  if (typeof suggestionId !== "string") return;
  const suggestion = await prisma.aISuggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion || suggestion.status !== "PENDING") return;
  await prisma.aISuggestion.update({ where: { id: suggestionId }, data: { suggestedJson: suggestion.originalJson as Prisma.InputJsonValue } });
  await prisma.auditLog.create({ data: { userId: owner.id, action: "AI_SUGGESTION_RESTORED", entityType: "AISuggestion", entityId: suggestionId } });
  revalidatePath("/admin/ai");
  redirect("/admin/ai?restored=1" as Route);
}
