import type { CSSProperties } from "react";
import type { PublicTheme, ThemeShellProps } from "@/core/themes/contracts";

function DefaultShell({ children }: ThemeShellProps) {
  const style = {
    "--accent": "#6d5dfc",
    "--accent-soft": "#eeeaff",
    "--accent-soft-dark": "#302a52",
    "--display-font": "var(--font-sans)",
    "--body-font": "var(--font-sans)",
    "--content-width": "760px",
    "--radius": "20px",
  } as CSSProperties;
  return <div className="public-theme theme-default" style={style}>{children}</div>;
}

function DefaultAdminPreview() {
  return (
    <div className="theme-preview clarity" aria-hidden="true">
      <div className="theme-preview-bar" />
      <div className="theme-preview-copy" />
    </div>
  );
}

export const defaultTheme: PublicTheme = {
  manifest: {
    id: "default",
    name: "Clarity",
    version: "0.1.0",
    author: "Knowledge Hub",
    description: "Warm, readable theme designed for technical notes.",
    engineVersion: ">=1.0 <2.0",
    supportedFeatures: ["home", "library", "article", "series", "dark-mode"],
    settingsSchemaVersion: 1,
  },
  tokens: { accent: "#6d5dfc", accentSoft: "#eeeaff", displayFont: "sans-serif", bodyFont: "sans-serif", contentWidth: "760px", radius: "20px" },
  components: { Shell: DefaultShell, AdminPreview: DefaultAdminPreview },
};
