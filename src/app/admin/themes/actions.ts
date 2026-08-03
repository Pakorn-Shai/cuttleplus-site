"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { activateTheme } from "@/core/site/settings";
import { requireOwner } from "@/lib/auth";
import { listThemes } from "@/themes/registry";

const themeSchema = z.object({ themeId: z.string().min(1).max(80) });

export async function activateThemeAction(formData: FormData) {
  await requireOwner();
  const parsed = themeSchema.safeParse({ themeId: formData.get("themeId") });
  const theme = parsed.success ? listThemes().find((item) => item.manifest.id === parsed.data.themeId) : undefined;
  if (!theme) redirect("/admin/themes?result=invalid");
  await activateTheme(theme.manifest.id, theme.manifest.version);
  revalidatePath("/", "layout");
  revalidatePath("/admin/themes");
  redirect("/admin/themes?result=activated");
}
