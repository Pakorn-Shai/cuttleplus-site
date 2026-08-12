import "server-only";

import { prisma } from "@/lib/prisma";

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  type: "page" | "category" | "series" | "collection" | "external" | "custom";
  position: number;
  visible: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  footerText: string;
  // Section 11: SEO defaults
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ogImageUrl: string;
  // Section 11: Footer & social links
  socialLinks: string; // JSON string of { label, url }[]
  // Section 11: Site logo
  logoUrl: string;
  faviconUrl: string;
  // Section 11: Localization
  defaultLanguage: string;
  timezone: string;
  // Section 11: Analytics
  analyticsId: string;
  // Section 11: Navigation
  navigationItems: string; // JSON string of NavigationItem[]
  // Section 12: AI Settings
  aiModel: string;
  aiMaxTokens: number;
  aiTimeoutMs: number;
  aiMonthlyBudgetUsd: number;
  aiUsageThisMonthUsd: number;
  // Section 16: Security review document
  securityReviewNotes: string;
  // Section 11: Upload limits & feature flags
  maxUploadBytes: number;
  featureFlags: string; // JSON string of { [key: string]: boolean }
}

const defaultNavigationItems: NavigationItem[] = [
  { id: "nav-knowledge", label: "คลังความรู้", url: "/knowledge", type: "page", position: 1, visible: true },
  { id: "nav-categories", label: "หมวดหมู่", url: "/categories", type: "page", position: 2, visible: true },
  { id: "nav-tags", label: "แท็ก", url: "/tags", type: "page", position: 3, visible: true },
  { id: "nav-series", label: "Series", url: "/series", type: "page", position: 4, visible: true },
  { id: "nav-about", label: "เกี่ยวกับฉัน", url: "/about", type: "page", position: 5, visible: true },
];

export const defaultSiteSettings: SiteSettings = {
  siteName: "Knowledge Hub",
  siteDescription: "คลังความรู้ส่วนตัวที่เขียนง่าย อ่านสบาย และค้นพบสิ่งที่เคยเรียนรู้ได้เสมอ",
  footerText: "สร้างไว้เพื่อทบทวนสิ่งที่เรียนรู้",
  defaultMetaTitle: "Knowledge Hub",
  defaultMetaDescription: "คลังความรู้ส่วนตัว",
  ogImageUrl: "",
  socialLinks: "[]",
  logoUrl: "",
  faviconUrl: "",
  defaultLanguage: "th",
  timezone: "Asia/Bangkok",
  analyticsId: "",
  navigationItems: JSON.stringify(defaultNavigationItems),
  aiModel: "",
  aiMaxTokens: 4096,
  aiTimeoutMs: 60000,
  aiMonthlyBudgetUsd: 0,
  aiUsageThisMonthUsd: 0,
  securityReviewNotes: "",
  maxUploadBytes: 5 * 1024 * 1024, // 5 MiB default
  featureFlags: "{}",
};

const settingKeys = Object.keys(defaultSiteSettings) as (keyof SiteSettings)[];

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: settingKeys } } });
  const values = new Map(rows.map((row) => [row.key, row.valueJson]));
  return Object.fromEntries(settingKeys.map((key) => {
    const value = values.get(key);
    return [key, typeof value === "string" && value.trim() ? value : defaultSiteSettings[key]];
  })) as unknown as SiteSettings;
}

export async function saveSiteSettings(settings: SiteSettings) {
  await prisma.$transaction(settingKeys.map((key) => prisma.siteSetting.upsert({
    where: { key },
    update: { valueJson: settings[key] },
    create: { key, valueJson: settings[key] },
  })));
}

export async function getActiveThemeId() {
  return (await prisma.themeActivation.findUnique({ where: { id: "active-theme" } }))?.themeId ?? "default";
}

export async function activateTheme(themeId: string, themeVersion: string) {
  await prisma.themeActivation.upsert({
    where: { id: "active-theme" },
    update: { themeId, themeVersion, settingsJson: {}, activatedAt: new Date() },
    create: { id: "active-theme", themeId, themeVersion, settingsJson: {} },
  });
}
