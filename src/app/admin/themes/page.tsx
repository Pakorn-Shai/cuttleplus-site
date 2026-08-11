import { Check, ExternalLink, Eye, Palette } from "lucide-react";
import type { ThemeFeature } from "@/core/themes/contracts";
import { getActiveThemeId } from "@/core/site/settings";
import { listThemes } from "@/themes/registry";
import { activateThemeAction } from "./actions";

const featureLabels: Record<ThemeFeature, string> = {
  home: "หน้าแรก",
  library: "คลังความรู้",
  article: "หน้าบทความ",
  series: "Series",
  "dark-mode": "Dark Mode",
};

export default async function ThemesPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [activeThemeId, query] = await Promise.all([getActiveThemeId(), searchParams]);
  const themes = listThemes();
  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Theme Manager</h2><p>เลือก Theme สำหรับหน้าบ้านโดยไม่เปลี่ยนโครงสร้างข้อมูล</p></div></header>
    {query.result === "activated" && <p className="admin-notice success" role="status">เปิดใช้งาน Theme ใหม่แล้ว</p>}
    {query.result === "invalid" && <p className="admin-notice error" role="alert">ไม่พบ Theme ที่เลือก</p>}
    <div className="theme-admin-grid">{themes.map((theme) => {
      const active = theme.manifest.id === activeThemeId;
      return <article className="theme-admin-card" key={theme.manifest.id}>
        <div className={`theme-preview ${theme.manifest.id === "minimal" ? "minimal" : ""}`}>
          <div className="theme-preview-bar" />
          <div className="theme-preview-copy" />
        </div>
        <div className="theme-card-meta">
          <div>
            <h3>{theme.manifest.name} <small>v{theme.manifest.version}</small></h3>
            <p>{theme.manifest.description}</p>
            <p style={{ marginTop: 6, fontSize: ".68rem", color: "#92939d" }}>
              by {theme.manifest.author} · Engine {theme.manifest.engineVersion} · Schema v{theme.manifest.settingsSchemaVersion}
            </p>
          </div>
          {active ? <span className="status-badge published"><Check size={12} /> ใช้งานอยู่</span> : <form action={activateThemeAction}><input name="themeId" type="hidden" value={theme.manifest.id} /><button className="secondary-button" type="submit"><Palette size={13} /> ใช้ Theme นี้</button></form>}
        </div>
        <div className="theme-features">
          <strong style={{ fontSize: ".72rem", color: "#686976" }}>รองรับ:</strong>
          <div className="theme-feature-list">
            {(["home", "library", "article", "series", "dark-mode"] as ThemeFeature[]).map((f) => (
              <span key={f} className={`theme-feature-badge ${theme.manifest.supportedFeatures.includes(f) ? "supported" : "missing"}`}>
                {theme.manifest.supportedFeatures.includes(f) ? "✓" : "✗"} {featureLabels[f]}
              </span>
            ))}
          </div>
          {theme.manifest.supportedFeatures.length < 5 && <p style={{ marginTop: 6, fontSize: ".66rem", color: "#a33434" }}>Feature ที่ขาดจะใช้ fallback component จาก Core</p>}
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <a href="/" target="_blank" className="secondary-button" style={{ fontSize: ".72rem", gap: 5 }}><Eye size={12} /> ดูตัวอย่าง <ExternalLink size={10} /></a>
        </div>
      </article>;
    })}</div>
    <section className="admin-panel" style={{ marginTop: 18 }}><div className="panel-head"><h3>Compatibility Contract</h3></div><div className="panel-body">
      <p className="muted" style={{ fontSize: ".78rem", lineHeight: 1.6 }}>Theme Engine 1.x · ทุกธีมต้องมี Manifest, settings schema version และ feature declaration หาก feature ขาด ระบบ Core จะใช้ fallback component Theme ไม่สามารถแก้ไข Business Logic หรือฐานข้อมูลโดยตรง เปลี่ยน Theme แล้ว URL และเนื้อหาเดิมต้องไม่เสีย</p>
    </div></section>
  </main>;
}