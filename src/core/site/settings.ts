import "server-only";

import { prisma } from "@/lib/prisma";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  footerText: string;
}

export const defaultSiteSettings: SiteSettings = {
  siteName: "Knowledge Hub",
  siteDescription: "คลังความรู้ส่วนตัวที่เขียนง่าย อ่านสบาย และค้นพบสิ่งที่เคยเรียนรู้ได้เสมอ",
  footerText: "สร้างไว้เพื่อทบทวนสิ่งที่เรียนรู้",
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
