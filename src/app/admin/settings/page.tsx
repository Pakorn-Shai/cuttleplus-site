import { DatabaseBackup, Download, Globe2, RotateCcw, Save } from "lucide-react";
import { BackupRestore } from "@/components/admin/backup-restore";
import { BackupValidator } from "@/components/admin/backup-validator";
import { getSiteSettings } from "@/core/site/settings";
import { saveSiteSettingsAction } from "./actions";

export default async function SiteSettingsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [settings, query] = await Promise.all([getSiteSettings(), searchParams]);
  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>ตั้งค่าเว็บไซต์</h2><p>ข้อมูลพื้นฐานที่แสดงใน metadata, header และ footer</p></div></header>
    {query.result === "saved" && <p className="admin-notice success" role="status">บันทึกการตั้งค่าเว็บไซต์แล้ว</p>}
    {query.result === "invalid" && <p className="admin-notice error" role="alert">กรุณาตรวจชื่อเว็บไซต์ คำอธิบาย และข้อความ footer</p>}
    <section className="admin-panel settings-panel"><div className="panel-head"><h3><Globe2 size={15} /> ข้อมูลเว็บไซต์</h3></div><form className="settings-form panel-body" action={saveSiteSettingsAction}>
      <label>ชื่อเว็บไซต์<input name="siteName" defaultValue={settings.siteName} required maxLength={120} /></label>
      <label>คำอธิบายเว็บไซต์<textarea name="siteDescription" defaultValue={settings.siteDescription} required maxLength={500} /></label>
      <label>ข้อความ Footer<input name="footerText" defaultValue={settings.footerText} required maxLength={240} /></label>
      <div><button className="primary-button" type="submit"><Save size={14} /> บันทึกการตั้งค่า</button></div>
    </form></section>
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
