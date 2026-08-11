"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function addContentRelationAction(formData: FormData) {
  await requireOwner();
  const sourceContentId = formData.get("sourceContentId");
  const targetContentId = formData.get("targetContentId");
  const relationType = formData.get("relationType");
  if (!sourceContentId || !targetContentId || !relationType || typeof sourceContentId !== "string" || typeof targetContentId !== "string" || typeof relationType !== "string") {
    redirect("/admin/content?result=invalid");
  }
  if (sourceContentId === targetContentId) redirect(`/admin/content/${sourceContentId}/edit`);

  await prisma.contentRelation.upsert({
    where: { sourceContentId_targetContentId_relationType: { sourceContentId, targetContentId, relationType: relationType as "RELATED" | "PREREQUISITE" | "FOLLOW_UP" | "ALTERNATIVE" | "SUPERSEDES" | "DUPLICATE" | "PART_OF" } },
    update: {},
    create: { sourceContentId, targetContentId, relationType: relationType as "RELATED" | "PREREQUISITE" | "FOLLOW_UP" | "ALTERNATIVE" | "SUPERSEDES" | "DUPLICATE" | "PART_OF" },
  });

  revalidatePath(`/admin/content/${sourceContentId}/edit`);
  redirect(`/admin/content/${sourceContentId}/edit`);
}

export async function removeContentRelationAction(formData: FormData) {
  await requireOwner();
  const sourceContentId = formData.get("sourceContentId");
  const targetContentId = formData.get("targetContentId");
  const relationType = formData.get("relationType");
  if (!sourceContentId || !targetContentId || !relationType || typeof sourceContentId !== "string" || typeof targetContentId !== "string" || typeof relationType !== "string") {
    redirect("/admin/content?result=invalid");
  }

  await prisma.contentRelation.deleteMany({
    where: {
      sourceContentId,
      targetContentId,
      relationType: relationType as "RELATED" | "PREREQUISITE" | "FOLLOW_UP" | "ALTERNATIVE" | "SUPERSEDES" | "DUPLICATE" | "PART_OF",
    },
  });

  revalidatePath(`/admin/content/${sourceContentId}/edit`);
  redirect(`/admin/content/${sourceContentId}/edit`);
}