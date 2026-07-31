import { Check, ExternalLink } from "lucide-react";
import { listThemes } from "@/themes/registry";

export default function ThemesPage() {
  const themes = listThemes();
  return <main className="admin-content"><header className="admin-page-head"><div><h2>Theme Manager</h2><p>Theme มีผลเฉพาะหน้าบ้านและรับข้อมูลผ่าน Core Contract</p></div></header><div className="theme-admin-grid">{themes.map((theme, index) => <article className="theme-admin-card" key={theme.manifest.id}><div className={`theme-preview ${index ? "minimal" : ""}`}><div className="theme-preview-bar" /><div className="theme-preview-copy" /></div><div className="theme-card-meta"><div><h3>{theme.manifest.name} <small>v{theme.manifest.version}</small></h3><p>{theme.manifest.description}</p></div>{index === 0 ? <span className="status-badge published"><Check size={12} /> ใช้งานอยู่</span> : <button className="secondary-button"><ExternalLink size={13} /> Preview</button>}</div></article>)}</div><section className="admin-panel" style={{ marginTop: 18 }}><div className="panel-head"><h3>Compatibility Contract</h3></div><div className="panel-body"><p className="muted">Theme Engine 1.x · ทุกธีมต้องมี Manifest, settings schema version และ feature declaration หาก feature ขาด ระบบ Core จะใช้ fallback component</p></div></section></main>;
}
