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

export const theme: ThemePalette = {
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

export function getThemeCssVariables() {
  return Object.entries(themeCssVariableMap).reduce<Record<string, string>>(
    (variables, [token, cssVariable]) => {
      variables[cssVariable] = theme[token as keyof ThemePalette];
      return variables;
    },
    {},
  );
}

export function getThemeCssText() {
  const toCssDeclarations = () =>
    Object.entries(getThemeCssVariables())
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n");

  return `:root {\n${toCssDeclarations()}\n}`;
}
