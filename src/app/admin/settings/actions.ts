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
  defaultMetaTitle: z.string().trim().max(120).default(""),
  defaultMetaDescription: z.string().trim().max(300).default(""),
  ogImageUrl: z.string().trim().max(500).default(""),
  socialLinks: z.string().trim().max(2000).default("[]"),
  logoUrl: z.string().trim().max(500).default(""),
  faviconUrl: z.string().trim().max(500).default(""),
  defaultLanguage: z.string().trim().max(10).default("th"),
  timezone: z.string().trim().max(60).default("Asia/Bangkok"),
  analyticsId: z.string().trim().max(100).default(""),
  securityReviewNotes: z.string().trim().max(5000).default(""),
  navigationItems: z.string().trim().max(5000).default("[]"),
  aiModel: z.string().trim().max(200).default(""),
  aiMaxTokens: z.coerce.number().int().min(256).max(32768).default(4096),
  aiTimeoutMs: z.coerce.number().int().min(5000).max(300000).default(60000),
  aiMonthlyBudgetUsd: z.coerce.number().min(0).max(10000).default(0),
  aiUsageThisMonthUsd: z.coerce.number().min(0).max(10000).default(0),
  maxUploadBytes: z.coerce.number().int().min(1024).max(10485760).default(5 * 1024 * 1024),
  featureFlags: z.string().trim().max(5000).default("{}"),
});

export async function saveSiteSettingsAction(formData: FormData) {
  await requireOwner();
  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    footerText: formData.get("footerText"),
    defaultMetaTitle: formData.get("defaultMetaTitle"),
    defaultMetaDescription: formData.get("defaultMetaDescription"),
    ogImageUrl: formData.get("ogImageUrl"),
    socialLinks: formData.get("socialLinks"),
    logoUrl: formData.get("logoUrl"),
    faviconUrl: formData.get("faviconUrl"),
    defaultLanguage: formData.get("defaultLanguage"),
    timezone: formData.get("timezone"),
    analyticsId: formData.get("analyticsId"),
    securityReviewNotes: formData.get("securityReviewNotes"),
    navigationItems: formData.get("navigationItems"),
    aiModel: formData.get("aiModel"),
    aiMaxTokens: formData.get("aiMaxTokens"),
    aiTimeoutMs: formData.get("aiTimeoutMs"),
    aiMonthlyBudgetUsd: formData.get("aiMonthlyBudgetUsd"),
    aiUsageThisMonthUsd: formData.get("aiUsageThisMonthUsd"),
    maxUploadBytes: formData.get("maxUploadBytes"),
    featureFlags: formData.get("featureFlags"),
  });
  if (!parsed.success) redirect("/admin/settings?result=invalid");
  await saveSiteSettings(parsed.data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?result=saved");
}
