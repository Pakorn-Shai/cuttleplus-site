"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function retryFailedJobAction(formData: FormData) {
  const owner = await requireOwner();
  const jobId = formData.get("jobId");
  if (!jobId || typeof jobId !== "string") redirect("/admin/ai?error=invalid");

  const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "FAILED") redirect("/admin/ai?error=not_found");

  await prisma.aIJob.update({
    where: { id: jobId },
    data: { status: "QUEUED", errorMessage: null, completedAt: null },
  });
  await prisma.auditLog.create({
    data: { userId: owner.id, action: "AI_JOB_RETRIED", entityType: "AIJob", entityId: jobId },
  });

  revalidatePath("/admin/ai");
  redirect("/admin/ai?retried=1");
}

export async function retryAllFailedJobsAction() {
  const owner = await requireOwner();

  const result = await prisma.aIJob.updateMany({
    where: { status: "FAILED" },
    data: { status: "QUEUED", errorMessage: null, completedAt: null },
  });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: { userId: owner.id, action: "AI_JOBS_BULK_RETRIED", entityType: "AIJob", metadataJson: { count: result.count } },
    });
  }

  revalidatePath("/admin/ai");
  redirect(`/admin/ai?retried=${result.count}`);
}