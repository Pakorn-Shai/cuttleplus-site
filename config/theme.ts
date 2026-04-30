export type ThemeMode = "light" | "dark";

export type ThemePalette = {
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  accent: string;
  accentForeground: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  muted: string;
  heroFrom: string;
  heroVia: string;
  heroTo: string;
};

export const theme: Record<ThemeMode, ThemePalette> = {
  light: {
    primary: "#047857",
    primaryHover: "#065f46",
    primaryForeground: "#ffffff",
    background: "#f9fafb",
    foreground: "#171717",
    accent: "#0d9488",
    accentForeground: "#ffffff",
    surface: "#ffffff",
    surfaceMuted: "#f3f4f6",
    border: "rgb(0 0 0 / 0.1)",
    muted: "rgb(23 23 23 / 0.65)",
    heroFrom: "#059669",
    heroVia: "#10b981",
    heroTo: "#14b8a6",
  },
  dark: {
    primary: "#34d399",
    primaryHover: "#6ee7b7",
    primaryForeground: "#022c22",
    background: "#030712",
    foreground: "#ededed",
    accent: "#2dd4bf",
    accentForeground: "#042f2e",
    surface: "#0b1220",
    surfaceMuted: "#111827",
    border: "rgb(255 255 255 / 0.15)",
    muted: "rgb(237 237 237 / 0.68)",
    heroFrom: "#064e3b",
    heroVia: "#065f46",
    heroTo: "#134e4a",
  },
};

export const themeCssVariableMap = {
  primary: "--primary",
  primaryHover: "--primary-hover",
  primaryForeground: "--primary-foreground",
  background: "--background",
  foreground: "--foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  surface: "--surface",
  surfaceMuted: "--surface-muted",
  border: "--border",
  muted: "--muted",
  heroFrom: "--hero-from",
  heroVia: "--hero-via",
  heroTo: "--hero-to",
} as const satisfies Record<keyof ThemePalette, `--${string}`>;

export function getThemeCssVariables(mode: ThemeMode) {
  return Object.entries(themeCssVariableMap).reduce<Record<string, string>>(
    (variables, [token, cssVariable]) => {
      variables[cssVariable] = theme[mode][token as keyof ThemePalette];
      return variables;
    },
    {},
  );
}

export function getThemeCssText() {
  const toCssDeclarations = (mode: ThemeMode) =>
    Object.entries(getThemeCssVariables(mode))
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n");

  return `:root {\n${toCssDeclarations("light")}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${toCssDeclarations(
    "dark",
  )}\n  }\n}`;
}