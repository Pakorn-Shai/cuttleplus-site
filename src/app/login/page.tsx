import { BookOpen, LockKeyhole } from "lucide-react";
import { isAuthConfigured } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata = { title: "เข้าสู่ระบบ", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const configured = isAuthConfigured();
  const invalid = (await searchParams).error === "invalid";
  return <main className="login-page"><section className="login-card"><span className="brand-mark"><BookOpen size={20} /></span><p className="eyebrow">Knowledge Hub Owner</p><h1>เข้าสู่พื้นที่จัดการ</h1><p className="muted">Admin ใช้สำหรับเจ้าของคลังความรู้เพียงคนเดียว</p>{!configured && <div className="login-alert">ตั้งค่า OWNER_EMAIL หรือ ADMIN_USERNAME พร้อม ADMIN_PASSWORD และ ADMIN_SESSION_SECRET ใน .env ก่อนเข้าสู่ระบบ</div>}{invalid && <div className="login-alert">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</div>}<form action={loginAction} className="login-form"><label>อีเมลหรือชื่อผู้ใช้<input name="identifier" type="text" defaultValue={process.env.OWNER_EMAIL ?? process.env.ADMIN_USERNAME} required autoComplete="username" /></label><label>รหัสผ่าน<input name="password" type="password" required autoComplete="current-password" /></label><button className="primary-button" disabled={!configured}><LockKeyhole size={15} /> เข้าสู่ระบบ</button></form></section></main>;
}
