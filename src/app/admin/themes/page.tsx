import { Check, Palette } from "lucide-react";
import { getActiveThemeId } from "@/core/site/settings";
import { listThemes } from "@/themes/registry";
import { activateThemeAction } from "./actions";

export default async function ThemesPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [activeThemeId, query] = await Promise.all([getActiveThemeId(), searchParams]);
  const themes = listThemes();
  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Theme Manager</h2><p>เลือก Theme สำหรับหน้าบ้านโดยไม่เปลี่ยนโครงสร้างข้อมูล</p></div></header>
    {query.result === "activated" && <p className="admin-notice success" role="status">เปิดใช้งาน Theme ใหม่แล้ว</p>}
    {query.result === "invalid" && <p className="admin-notice error" role="alert">ไม่พบ Theme ที่เลือก</p>}
    <div className="theme-admin-grid">{themes.map((theme) => {
      const active = theme.manifest.id === activeThemeId;
      return <article className="theme-admin-card" key={theme.manifest.id}><div className={`theme-preview ${theme.manifest.id === "minimal" ? "minimal" : ""}`}><div className="theme-preview-bar" /><div className="theme-preview-copy" /></div><div className="theme-card-meta"><div><h3>{theme.manifest.name} <small>v{theme.manifest.version}</small></h3><p>{theme.manifest.description}</p></div>{active ? <span className="status-badge published"><Check size={12} /> ใช้งานอยู่</span> : <form action={activateThemeAction}><input name="themeId" type="hidden" value={theme.manifest.id} /><button className="secondary-button" type="submit"><Palette size={13} /> ใช้ Theme นี้</button></form>}</div></article>;
    })}</div>
    <section className="admin-panel" style={{ marginTop: 18 }}><div className="panel-head"><h3>Compatibility Contract</h3></div><div className="panel-body"><p className="muted">Theme Engine 1.x · ทุกธีมต้องมี Manifest, settings schema version และ feature declaration หาก feature ขาด ระบบ Core จะใช้ fallback component</p></div></section>
  </main>;
}
