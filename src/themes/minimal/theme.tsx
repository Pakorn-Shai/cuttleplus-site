import type { CSSProperties } from "react";
import type { PublicTheme, ThemeShellProps } from "@/core/themes/contracts";

function MinimalShell({ children }: ThemeShellProps) {
  const style = {
    "--accent": "#0b766e",
    "--accent-soft": "#dff7f2",
    "--accent-soft-dark": "#173d3a",
    "--display-font": "Georgia, serif",
    "--body-font": "Georgia, serif",
    "--content-width": "700px",
    "--radius": "4px",
  } as CSSProperties;
  return <div className="public-theme theme-minimal" style={style}>{children}</div>;
}

export const minimalTheme: PublicTheme = {
  manifest: {
    id: "minimal",
    name: "Notebook",
    version: "0.1.0",
    author: "Knowledge Hub",
    description: "A quiet, typography-led alternative theme.",
    engineVersion: ">=1.0 <2.0",
    supportedFeatures: ["home", "library", "article", "dark-mode"],
    settingsSchemaVersion: 1,
  },
  tokens: { accent: "#0b766e", accentSoft: "#dff7f2", displayFont: "Georgia, serif", bodyFont: "Georgia, serif", contentWidth: "700px", radius: "4px" },
  components: { Shell: MinimalShell },
};
