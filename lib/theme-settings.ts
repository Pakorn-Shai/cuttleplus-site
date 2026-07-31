import { prisma } from "@/lib/prisma";
import type { CSSProperties } from "react";

export const heroStyleOptions = ["gradient", "solid", "image", "minimal"] as const;
export type HeroStyle = (typeof heroStyleOptions)[number];
export const logoSizeOptions = ["small", "medium", "large"] as const;
export type LogoSize = (typeof logoSizeOptions)[number];

export type ThemeSettings = {
  id?: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  logoPublicId: string | null;
  faviconPublicId: string | null;
  logoSize: LogoSize;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  cardBackgroundColor: string;
  contentWidth: string;
  headerStyle: string;
  cardRadius: string;
  showSiteName: boolean;
  showLogo: boolean;
  showFooterBranding: boolean;
  showHero: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonHref: string;
  heroStyle: HeroStyle;
  heroBackgroundImageUrl: string | null;
  heroOverlay: boolean;
};

export const defaultThemeSettings: ThemeSettings = {
  siteName: "CuttlePlus",
  siteDescription: "Read about technology, tools, and tutorials made simple.",
  logoUrl: null,
  faviconUrl: null,
  logoPublicId: null,
  faviconPublicId: null,
  logoSize: "medium",
  primaryColor: "#0f766e",
  accentColor: "#14b8a6",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  mutedTextColor: "#6b7280",
  cardBackgroundColor: "#ffffff",
  contentWidth: "1200px",
  headerStyle: "default",
  cardRadius: "16px",
  showSiteName: true,
  showLogo: true,
  showFooterBranding: true,
  showHero: true,
  heroTitle: "CuttlePlus",
  heroSubtitle: "Read about technology, tools, and tutorials made simple.",
  heroButtonText: "Start Reading",
  heroButtonHref: "/blog",
  heroStyle: "gradient",
  heroBackgroundImageUrl: null,
  heroOverlay: true,
};

export const themeSettingPresets = {
  contentWidths: ["960px", "1200px", "1440px"],
  cardRadii: ["0px", "12px", "16px", "24px"],
  headerStyles: ["default", "minimal"],
} as const;

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandShortHexColor(value: string) {
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return value.toLowerCase();
}

export function isValidHexColor(value: string | null | undefined) {
  return Boolean(value && hexColorPattern.test(value.trim()));
}

export function isValidAssetPath(value: string | null | undefined) {
  if (!value) return true;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  );
}

export function isValidHeroHref(value: string | null | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  );
}

function sanitizeOptionalText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function sanitizeColor(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return isValidHexColor(text) ? expandShortHexColor(text) : fallback;
}

function sanitizeRequiredText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function sanitizePreset<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]) {
  const text = typeof value === "string" ? value.trim() : "";
  return options.includes(text as T[number]) ? text : fallback;
}

type RawThemeSettings = Partial<
  Omit<ThemeSettings, "siteDescription" | "heroStyle" | "logoSize"> & {
    siteDescription: string | null;
    heroStyle: string | null;
    logoSize: string | null;
  }
>;

export function normalizeThemeSettings(settings: RawThemeSettings | null | undefined): ThemeSettings {
  const logoUrl = sanitizeOptionalText(settings?.logoUrl);
  const faviconUrl = sanitizeOptionalText(settings?.faviconUrl);
  const heroBackgroundImageUrl = sanitizeOptionalText(settings?.heroBackgroundImageUrl);
  const requestedHeroStyle = sanitizePreset(
    settings?.heroStyle,
    heroStyleOptions,
    defaultThemeSettings.heroStyle,
  ) as HeroStyle;
  const normalizedHeroBackgroundImageUrl = isValidAssetPath(heroBackgroundImageUrl)
    ? heroBackgroundImageUrl
    : null;
  const heroButtonHref = sanitizeRequiredText(settings?.heroButtonHref, defaultThemeSettings.heroButtonHref);

  return {
    id: settings?.id,
    siteName: sanitizeRequiredText(settings?.siteName, defaultThemeSettings.siteName),
    siteDescription:
      sanitizeOptionalText(settings?.siteDescription) ?? defaultThemeSettings.siteDescription,
    logoUrl: isValidAssetPath(logoUrl) ? logoUrl : null,
    faviconUrl: isValidAssetPath(faviconUrl) ? faviconUrl : null,
    logoPublicId: sanitizeOptionalText(settings?.logoPublicId),
    faviconPublicId: sanitizeOptionalText(settings?.faviconPublicId),
    logoSize: sanitizePreset(settings?.logoSize, logoSizeOptions, defaultThemeSettings.logoSize) as LogoSize,
    primaryColor: sanitizeColor(settings?.primaryColor, defaultThemeSettings.primaryColor),
    accentColor: sanitizeColor(settings?.accentColor, defaultThemeSettings.accentColor),
    backgroundColor: sanitizeColor(settings?.backgroundColor, defaultThemeSettings.backgroundColor),
    textColor: sanitizeColor(settings?.textColor, defaultThemeSettings.textColor),
    mutedTextColor: sanitizeColor(settings?.mutedTextColor, defaultThemeSettings.mutedTextColor),
    cardBackgroundColor: sanitizeColor(
      settings?.cardBackgroundColor,
      defaultThemeSettings.cardBackgroundColor,
    ),
    contentWidth: sanitizePreset(
      settings?.contentWidth,
      themeSettingPresets.contentWidths,
      "1200px",
    ),
    headerStyle: sanitizePreset(
      settings?.headerStyle,
      themeSettingPresets.headerStyles,
      "default",
    ),
    cardRadius: sanitizePreset(
      settings?.cardRadius,
      themeSettingPresets.cardRadii,
      "16px",
    ),
    showSiteName: settings?.showSiteName ?? defaultThemeSettings.showSiteName,
    showLogo: settings?.showLogo ?? defaultThemeSettings.showLogo,
    showFooterBranding: settings?.showFooterBranding ?? defaultThemeSettings.showFooterBranding,
    showHero: settings?.showHero ?? defaultThemeSettings.showHero,
    heroTitle: sanitizeRequiredText(settings?.heroTitle, defaultThemeSettings.heroTitle),
    heroSubtitle: sanitizeRequiredText(settings?.heroSubtitle, defaultThemeSettings.heroSubtitle),
    heroButtonText: sanitizeRequiredText(settings?.heroButtonText, defaultThemeSettings.heroButtonText),
    heroButtonHref: isValidHeroHref(heroButtonHref) ? heroButtonHref : defaultThemeSettings.heroButtonHref,
    heroStyle: requestedHeroStyle,
    heroBackgroundImageUrl: normalizedHeroBackgroundImageUrl,
    heroOverlay: settings?.heroOverlay ?? defaultThemeSettings.heroOverlay,
  };
}

export async function getThemeSettings() {
  try {
    const settings = await prisma.siteSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });

    return normalizeThemeSettings(settings ?? defaultThemeSettings);
  } catch (error) {
    console.error("Failed to load theme settings. Falling back to defaults.", error);
    return defaultThemeSettings;
  }
}

export async function getOrCreateThemeSettings() {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return normalizeThemeSettings(existing);
  }

  const created = await prisma.siteSetting.create({
    data: {
      siteName: defaultThemeSettings.siteName,
      siteDescription: defaultThemeSettings.siteDescription,
      primaryColor: defaultThemeSettings.primaryColor,
      accentColor: defaultThemeSettings.accentColor,
      backgroundColor: defaultThemeSettings.backgroundColor,
      textColor: defaultThemeSettings.textColor,
      mutedTextColor: defaultThemeSettings.mutedTextColor,
      cardBackgroundColor: defaultThemeSettings.cardBackgroundColor,
      contentWidth: defaultThemeSettings.contentWidth,
      headerStyle: defaultThemeSettings.headerStyle,
      cardRadius: defaultThemeSettings.cardRadius,
      showSiteName: defaultThemeSettings.showSiteName,
      showLogo: defaultThemeSettings.showLogo,
      showFooterBranding: defaultThemeSettings.showFooterBranding,
      showHero: defaultThemeSettings.showHero,
      heroTitle: defaultThemeSettings.heroTitle,
      heroSubtitle: defaultThemeSettings.heroSubtitle,
      heroButtonText: defaultThemeSettings.heroButtonText,
      heroButtonHref: defaultThemeSettings.heroButtonHref,
      heroStyle: defaultThemeSettings.heroStyle,
      heroBackgroundImageUrl: defaultThemeSettings.heroBackgroundImageUrl,
      heroOverlay: defaultThemeSettings.heroOverlay,
      logoSize: defaultThemeSettings.logoSize,
    },
  });

  return normalizeThemeSettings(created);
}

export function getThemeCssVariables(settings: ThemeSettings) {
  return {
    "--color-primary": settings.primaryColor,
    "--color-accent": settings.accentColor,
    "--color-background": settings.backgroundColor,
    "--color-text": settings.textColor,
    "--color-muted-text": settings.mutedTextColor,
    "--color-card-background": settings.cardBackgroundColor,
    "--content-width": settings.contentWidth,
    "--card-radius": settings.cardRadius,
    "--primary": settings.primaryColor,
    "--primary-hover": settings.primaryColor,
    "--background": settings.backgroundColor,
    "--foreground": settings.textColor,
    "--accent": settings.accentColor,
    "--surface": settings.cardBackgroundColor,
    "--muted": settings.mutedTextColor,
    "--hero-from": settings.primaryColor,
    "--hero-via": settings.accentColor,
    "--hero-to": settings.accentColor,
  } as CSSProperties;
}