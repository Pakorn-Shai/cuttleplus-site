"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { restoreContentRevision } from "@/core/content/editor-service";
import { requireOwner } from "@/lib/auth";

const restoreSchema = z.object({ contentId: z.string().cuid(), revisionId: z.string().cuid() });

export async function restoreRevisionAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = restoreSchema.safeParse({ contentId: formData.get("contentId"), revisionId: formData.get("revisionId") });
  if (!parsed.success) return;
  await restoreContentRevision(parsed.data.contentId, parsed.data.revisionId, owner.id);
  revalidatePath(`/admin/content/${parsed.data.contentId}/edit`);
  revalidatePath(`/admin/content/${parsed.data.contentId}/revisions`);
  revalidatePath("/knowledge");
  redirect(`/admin/content/${parsed.data.contentId}/revisions?restored=1` as Route);
}
