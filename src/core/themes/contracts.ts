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

export interface PublicTheme {
  manifest: ThemeManifest;
  tokens: ThemeTokens;
  components: { Shell: ComponentType<ThemeShellProps> };
}
