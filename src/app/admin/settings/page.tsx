import { DatabaseBackup, Download, Globe2, ListOrdered, Palette, RotateCcw, Save, Settings2, Shield, Sparkles } from "lucide-react";
import { BackupRestore } from "@/components/admin/backup-restore";
import { BackupValidator } from "@/components/admin/backup-validator";
import { getSiteSettings } from "@/core/site/settings";
import { saveSiteSettingsAction } from "./actions";

export default async function SiteSettingsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [settings, query] = await Promise.all([getSiteSettings(), searchParams]);
  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>ตั้งค่าเว็บไซต์</h2><p>ข้อมูลพื้นฐานที่แสดงใน metadata, header และ footer</p></div></header>
    {query.result === "saved" && <p className="admin-notice success" role="status">บันทึกการตั้งค่าเว็บไซต์แล้ว</p>}
    {query.result === "invalid" && <p className="admin-notice error" role="alert">กรุณาตรวจข้อมูลที่กรอกให้ถูกต้อง</p>}
    <form action={saveSiteSettingsAction}>
      <section className="admin-panel settings-panel"><div className="panel-head"><h3><Globe2 size={15} /> ข้อมูลเว็บไซต์</h3></div><div className="settings-form panel-body">
        <label>ชื่อเว็บไซต์<input name="siteName" defaultValue={settings.siteName} required maxLength={120} /></label>
        <label>คำอธิบายเว็บไซต์<textarea name="siteDescription" defaultValue={settings.siteDescription} required maxLength={500} /></label>
        <label>ข้อความ Footer<input name="footerText" defaultValue={settings.footerText} required maxLength={240} /></label>
        <label>ภาษาหลัก<input name="defaultLanguage" defaultValue={settings.defaultLanguage} maxLength={10} placeholder="th" /></label>
        <label>Timezone<input name="timezone" defaultValue={settings.timezone} maxLength={60} placeholder="Asia/Bangkok" /></label>
      </div></section>

      <section className="admin-panel settings-panel"><div className="panel-head"><h3><Palette size={15} /> SEO & Branding</h3></div><div className="settings-form panel-body">
        <label>Meta Title (default)<input name="defaultMetaTitle" defaultValue={settings.defaultMetaTitle} maxLength={120} placeholder="Knowledge Hub" /></label>
        <label>Meta Description (default)<textarea name="defaultMetaDescription" defaultValue={settings.defaultMetaDescription} maxLength={300} placeholder="คลังความรู้ส่วนตัว" /></label>
        <label>OG Image URL<input name="ogImageUrl" defaultValue={settings.ogImageUrl} maxLength={500} placeholder="https://..." /></label>
        <label>Logo URL<input name="logoUrl" defaultValue={settings.logoUrl} maxLength={500} placeholder="https://..." /></label>
        <label>Favicon URL<input name="faviconUrl" defaultValue={settings.faviconUrl} maxLength={500} placeholder="/favicon.ico" /></label>
        <label>Social Links (JSON array)<textarea name="socialLinks" defaultValue={settings.socialLinks} maxLength={2000} placeholder='[{"label":"GitHub","url":"https://github.com/..."}]' /></label>
      </div></section>

      <section className="admin-panel settings-panel"><div className="panel-head"><h3><ListOrdered size={15} /> Navigation</h3></div><div className="settings-form panel-body">
        <label>Navigation Items (JSON array)<textarea name="navigationItems" defaultValue={settings.navigationItems} maxLength={5000} placeholder='[{"id":"nav-1","label":"คลังความรู้","url":"/knowledge","type":"page","position":1,"visible":true}]' rows={6} /></label>
        <p className="muted" style={{ fontSize: ".68rem" }}>แต่ละรายการมี: id, label, url, type (page/category/series/collection/external/custom), position, visible</p>
      </div></section>

      <section className="admin-panel settings-panel"><div className="panel-head"><h3><Sparkles size={15} /> AI Settings</h3></div><div className="settings-form panel-body">
        <label>AI Model (OpenRouter)<input name="aiModel" defaultValue={settings.aiModel} maxLength={200} placeholder="openai/gpt-4o-mini (empty = use env OPENROUTER_MODEL)" /></label>
        <label>Max Tokens per Request<input name="aiMaxTokens" type="number" defaultValue={settings.aiMaxTokens} min={256} max={32768} /></label>
        <label>Request Timeout (ms)<input name="aiTimeoutMs" type="number" defaultValue={settings.aiTimeoutMs} min={5000} max={300000} /></label>
        <label>Monthly Budget (USD, 0 = unlimited)<input name="aiMonthlyBudgetUsd" type="number" step="0.01" defaultValue={settings.aiMonthlyBudgetUsd} min={0} max={10000} /></label>
        <label>Usage This Month (USD)<input name="aiUsageThisMonthUsd" type="number" step="0.01" defaultValue={settings.aiUsageThisMonthUsd} min={0} max={10000} /></label>
        <p className="muted" style={{ fontSize: ".68rem" }}>ตั้งค่า model, token limit, timeout และงบประมาณรายเดือน (USD) สำหรับ AI features</p>
      </div></section>

      <section className="admin-panel settings-panel"><div className="panel-head"><h3><Shield size={15} /> Analytics & Security</h3></div><div className="settings-form panel-body">
        <label>Analytics ID (ไม่ติดตาม Private content)<input name="analyticsId" defaultValue={settings.analyticsId} maxLength={100} placeholder="G-XXXXXXXXXX" /></label>
        <label>บันทึก Security Review<textarea name="securityReviewNotes" defaultValue={settings.securityReviewNotes} maxLength={5000} placeholder="บันทึกผลการตรวจ security review..." /></label>
      </div></section>

      <section className="admin-panel settings-panel"><div className="panel-head"><h3><Settings2 size={15} /> Upload Limits & Feature Flags</h3></div><div className="settings-form panel-body">
        <label>Max Upload Size (bytes)<input name="maxUploadBytes" type="number" defaultValue={settings.maxUploadBytes} min={1024} max={10485760} step={1024} /><small style={{ color: "#92939d", fontSize: ".68rem" }}>ค่าปัจจุบัน: {(settings.maxUploadBytes / 1024 / 1024).toFixed(1)} MiB (สูงสุด 10 MiB)</small></label>
        <label>Feature Flags (JSON)<textarea name="featureFlags" defaultValue={settings.featureFlags} maxLength={5000} placeholder='{"enableExperimentalBlocks": true, "showSeriesProgress": false}' rows={3} /><small style={{ color: "#92939d", fontSize: ".68rem" }}>กำหนดเปิด/ปิดฟีเจอร์เพิ่มเติม เป็น JSON object {"{"}key: boolean{"}"}</small></label>
      </div></section>

      <div style={{ marginTop: 16 }}><button className="primary-button" type="submit"><Save size={14} /> บันทึกการตั้งค่า</button></div>
    </form>

    <section className="admin-panel settings-panel backup-panel"><div className="panel-head"><h3><DatabaseBackup size={15} /> Database backup</h3></div><div className="panel-body backup-copy">
      <p>ดาวน์โหลดข้อมูลเว็บไซต์เป็น JSON แบบ versioned รวมบทความ Revision หมวดหมู่ แท็ก ชุดความรู้ การตั้งค่า Theme ประวัติ AI และ Audit log</p>
      <p className="muted">ไม่รวมค่าใน .env, API keys, session, rate-limit ชั่วคราว และไฟล์รูปจริงใน object storage โดย Media จะมีเฉพาะ metadata และ URL</p>
      <a className="secondary-button" href="/api/admin/backup"><Download size={14} /> ดาวน์โหลด Backup</a>
      <BackupValidator />
    </div></section>
    <section className="admin-panel settings-panel backup-panel"><div className="panel-head"><h3><RotateCcw size={15} /> Restore ข้อมูล</h3></div><div className="panel-body backup-copy">
      <p>กู้คืนข้อมูลทั้งฐานข้อมูลจากไฟล์ Backup ที่ดาวน์โหลดไว้ ระบบจะตรวจไฟล์ แสดงแผนผลกระทบ และสร้าง Backup ของสถานะปัจจุบันก่อนยืนยันเสมอ</p>
      <p className="muted">การ Restore จะลบข้อมูลปัจจุบันทั้งหมดแล้วแทนที่ด้วยข้อมูลใน Backup กรุณาตรวจสอบแผนก่อนยืนยัน</p>
      <BackupRestore />
    </div></section>
  </main>;
}