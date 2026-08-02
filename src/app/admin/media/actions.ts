"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getStorageAdapter } from "@/core/media/storage";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteMediaAction(formData: FormData) {
  const owner = await requireOwner();
  const id = z.string().cuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const media = await prisma.media.findUnique({ where: { id: id.data }, include: { _count: { select: { coverFor: true } } } });
  if (!media) redirect("/admin/media");
  if (media._count.coverFor) redirect("/admin/media?error=in_use");
  await getStorageAdapter(media.storageProvider).delete(media.objectKey);
  await prisma.$transaction([
    prisma.media.delete({ where: { id: media.id } }),
    prisma.auditLog.create({ data: { userId: owner.id, action: "MEDIA_DELETED", entityType: "Media", entityId: media.id } }),
  ]);
  revalidatePath("/admin/media");
  redirect("/admin/media");
}
