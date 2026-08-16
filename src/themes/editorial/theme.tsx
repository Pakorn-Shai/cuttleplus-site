import type { CSSProperties } from "react";
import type { PublicTheme, ThemeShellProps } from "@/core/themes/contracts";
import { EditorialFooter } from "./footer";
import { EditorialHeader } from "./header";
import { EditorialHero } from "./hero";

function EditorialShell({ children }: ThemeShellProps) {
  const style = {
    "--accent": "#8a3b2e",
    "--accent-soft": "#f4e5dd",
    "--accent-soft-dark": "#3c241e",
    "--display-font": "Georgia, 'Times New Roman', serif",
    "--body-font": "Georgia, 'Times New Roman', serif",
    "--content-width": "720px",
    "--radius": "2px",
  } as CSSProperties;
  return <div className="public-theme theme-editorial" style={style}>{children}</div>;
}

function EditorialAdminPreview() {
  return (
    <div className="theme-preview editorial" aria-hidden="true">
      <div className="theme-preview-ed-kicker" />
      <div className="theme-preview-ed-title" />
      <div className="theme-preview-ed-rule" />
      <div className="theme-preview-ed-columns">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}

export const editorialTheme: PublicTheme = {
  manifest: {
    id: "editorial",
    name: "Editorial",
    version: "1.0.0",
    author: "Knowledge Hub",
    description: "โครงหน้าแบบหนังสือพิมพ์ — masthead กึ่งกลาง หน้าคอลัมน์ และเส้นคั่นบาง ๆ ต่างจากธีมการ์ดทั่วไป",
    engineVersion: ">=1.0 <2.0",
    supportedFeatures: ["home", "library", "article", "series", "dark-mode"],
    settingsSchemaVersion: 1,
  },
  tokens: {
    accent: "#8a3b2e",
    accentSoft: "#f4e5dd",
    displayFont: "Georgia, serif",
    bodyFont: "Georgia, serif",
    contentWidth: "720px",
    radius: "2px",
  },
  components: {
    Shell: EditorialShell,
    Header: EditorialHeader,
    Footer: EditorialFooter,
    HomeHero: EditorialHero,
    AdminPreview: EditorialAdminPreview,
  },
};