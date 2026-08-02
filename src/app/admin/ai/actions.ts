"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { reviewSuggestion } from "@/core/ai/service";
import { requireOwner } from "@/lib/auth";

const reviewSchema = z.object({ suggestionId: z.string().cuid(), decision: z.enum(["accept", "reject"]) });

export async function reviewSuggestionAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = reviewSchema.safeParse({ suggestionId: formData.get("suggestionId"), decision: formData.get("decision") });
  if (!parsed.success) return;
  try {
    await reviewSuggestion({ ...parsed.data, userId: owner.id });
  } catch (error) {
    if (error instanceof Error && error.message === "CONTENT_CHANGED") redirect("/admin/ai?error=content_changed");
    throw error;
  }
  revalidatePath("/admin/ai");
  revalidatePath("/admin/content");
  revalidatePath("/knowledge");
  redirect(`/admin/ai?reviewed=${parsed.data.decision}` as Route);
}
