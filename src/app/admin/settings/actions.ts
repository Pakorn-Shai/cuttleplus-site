"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { saveSiteSettings } from "@/core/site/settings";
import { requireOwner } from "@/lib/auth";

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(120),
  siteDescription: z.string().trim().min(1).max(500),
  footerText: z.string().trim().min(1).max(240),
});

export async function saveSiteSettingsAction(formData: FormData) {
  await requireOwner();
  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    footerText: formData.get("footerText"),
  });
  if (!parsed.success) redirect("/admin/settings?result=invalid");
  await saveSiteSettings(parsed.data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?result=saved");
}
