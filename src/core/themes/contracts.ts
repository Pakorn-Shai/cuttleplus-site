import type { ComponentType, ReactNode } from "react";

export type ThemeFeature = "home" | "library" | "article" | "series" | "dark-mode";

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  engineVersion: string;
  supportedFeatures: ThemeFeature[];
  settingsSchemaVersion: number;
}

export interface ThemeTokens {
  accent: string;
  accentSoft: string;
  displayFont: string;
  bodyFont: string;
  contentWidth: string;
  radius: string;
}

export interface ThemeShellProps { children: ReactNode }

export interface ThemeNavItem {
  label: string;
  url: string;
  visible: boolean;
}

export interface ThemeHeaderProps {
  siteName: string;
  navigationItems: ThemeNavItem[];
}

export interface ThemeFooterProps {
  siteName: string;
  footerText: string;
}

export interface ThemeHeroCategory {
  name: string;
  slug: string;
  color: string;
  count: number;
}

export interface ThemeHomeHeroProps {
  siteName: string;
  siteDescription: string;
  categories: ThemeHeroCategory[];
  totalContents: number;
  recentTitles: string[];
}

export interface PublicTheme {
  manifest: ThemeManifest;
  tokens: ThemeTokens;
  components: {
    /** Root wrapper that provides theme CSS variables. Required. */
    Shell: ComponentType<ThemeShellProps>;
    /** Optional site header. Falls back to the core SiteHeader. */
    Header?: ComponentType<ThemeHeaderProps>;
    /** Optional site footer. Falls back to the core SiteFooter. */
    Footer?: ComponentType<ThemeFooterProps>;
    /** Optional homepage hero. Falls back to the core DefaultHomeHero. */
    HomeHero?: ComponentType<ThemeHomeHeroProps>;
    /** Small visual sample rendered on the admin Theme Manager card. */
    AdminPreview?: ComponentType;
  };
}