"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createQuickCapture } from "@/core/content/editor-service";
import { requireOwner } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";

const quickCaptureSchema = z.object({
  title: z.string().max(240).optional(),
  text: z.string().trim().min(1).max(20_000),
  sourceUrl: z.union([z.literal(""), z.string().url().max(2_000)]).optional(),
  contentType: z.enum(["note", "code", "link"]),
});

export async function quickCaptureAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = quickCaptureSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    text: String(formData.get("text") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    contentType: formData.get("contentType"),
  });
  if (!parsed.success) redirect("/admin?capture=invalid");
  const rateLimit = await consumeRateLimit("quick-capture", owner.id, 60, 60);
  if (!rateLimit.allowed) redirect("/admin?capture=rate_limited");

  const content = await createQuickCapture({
    ...parsed.data,
    title: parsed.data.title || undefined,
    sourceUrl: parsed.data.sourceUrl || undefined,
  }, owner.id);
  revalidatePath("/admin");
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/content");
  redirect(`/admin/inbox?result=captured&id=${content.id}`);
}
