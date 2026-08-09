import Link from "next/link";
import { Archive, BookOpen, Boxes, FileText, FolderTree, Image, Inbox, LayoutDashboard, ListOrdered, LogOut, Palette, Search, Settings, Sparkles, Tags } from "lucide-react";
import type { Route } from "next";
import { logoutAction } from "@/app/login/actions";
import { AdminMobileNav } from "./admin-mobile-nav";

const mainLinks = [
  ["ภาพรวม", "/admin", LayoutDashboard], ["กล่องรับเข้า", "/admin/inbox", Inbox], ["เนื้อหาทั้งหมด", "/admin/content", FileText],
] as const;
const manageLinks = [
  ["หมวดหมู่", "/admin/categories", FolderTree], ["แท็ก", "/admin/tags", Tags], ["Series", "/admin/series", ListOrdered], ["ชุดความรู้", "/admin/collections", Boxes], ["คลังสื่อ", "/admin/media", Image], ["AI Workspace", "/admin/ai", Sparkles], ["ธีม", "/admin/themes", Palette],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">
    <a href="#admin-main-content" className="skip-nav">ข้ามไปยังเนื้อหาหลัก</a>
    <aside className="admin-sidebar">
      <div className="admin-brand"><Link className="brand" href="/admin"><span className="brand-mark"><BookOpen size={18} /></span><span>Knowledge Hub</span></Link><small>Admin workspace</small></div>
      <nav className="admin-nav" aria-label="เมนูผู้ดูแล">
        {mainLinks.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={17} /><span>{label}</span></Link>)}
        <p className="admin-nav-label">จัดการ</p>
        {manageLinks.map(([label, href, Icon]) => <Link href={href as Route} key={href}><Icon size={17} /><span>{label}</span></Link>)}
        <p className="admin-nav-label">ระบบ</p>
        <Link href="/admin/settings"><Settings size={17} /><span>ตั้งค่าเว็บไซต์</span></Link>
        <Link href="/"><Archive size={17} /><span>เปิดหน้าบ้าน</span></Link>
      </nav>
      <div className="admin-user"><div className="avatar">KH</div><div><strong>Knowledge Owner</strong><span>Owner</span></div><form action={logoutAction}><button className="icon-button" aria-label="ออกจากระบบ"><LogOut size={14} /></button></form></div>
    </aside>
    <section id="admin-main-content" className="admin-main"><header className="admin-topbar"><div className="admin-top-title"><AdminMobileNav /><h1>พื้นที่จัดการความรู้</h1></div><div className="admin-top-actions"><Link className="icon-button" href="/admin/content" aria-label="ค้นหาเนื้อหา"><Search size={16} /></Link><Link className="primary-button" href="/admin/content/new">+ สร้างบทความ</Link></div></header>{children}</section>
  </div>;
}
