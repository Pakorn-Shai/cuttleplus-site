"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroyOwnerSession, requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function revokeAllSessionsAction() {
  const owner = await requireOwner();
  await prisma.auditLog.create({
    data: { userId: owner.id, action: "SESSIONS_REVOKED", entityType: "User", entityId: owner.id },
  });
  await destroyOwnerSession();
  redirect("/login?revoked=1");
}