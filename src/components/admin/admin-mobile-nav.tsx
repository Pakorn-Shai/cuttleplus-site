"use client";

import { BookOpen, Boxes, FileText, FolderTree, Image, Inbox, LayoutDashboard, ListOrdered, Menu, Palette, Settings, Sparkles, Tags, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["ภาพรวม", "/admin", LayoutDashboard],
  ["กล่องรับเข้า", "/admin/inbox", Inbox],
  ["เนื้อหาทั้งหมด", "/admin/content", FileText],
  ["หมวดหมู่", "/admin/categories", FolderTree],
  ["แท็ก", "/admin/tags", Tags],
  ["Series", "/admin/series", ListOrdered],
  ["ชุดความรู้", "/admin/collections", Boxes],
  ["คลังสื่อ", "/admin/media", Image],
  ["AI Workspace", "/admin/ai", Sparkles],
  ["ธีม", "/admin/themes", Palette],
  ["ตั้งค่าเว็บไซต์", "/admin/settings", Settings],
] as const;

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <>
    <button className="icon-button admin-mobile-trigger" type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนูผู้ดูแล" aria-expanded={open} aria-controls="admin-mobile-drawer"><Menu size={18} /></button>
    {open && <button className="admin-mobile-backdrop" type="button" aria-label="ปิดเมนูผู้ดูแล" onClick={() => setOpen(false)} />}
    {open && <aside className="admin-mobile-drawer open" id="admin-mobile-drawer">
      <header><span className="brand"><span className="brand-mark"><BookOpen size={17} /></span><span>Knowledge Hub</span></span><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="ปิดเมนู"><X size={17} /></button></header>
      <nav aria-label="เมนูผู้ดูแลบนมือถือ">{links.map(([label, href, Icon]) => <Link className={pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`)) ? "active" : ""} href={href as Route} key={href} onClick={() => setOpen(false)}><Icon size={17} /><span>{label}</span></Link>)}</nav>
      <Link className="secondary-button" href="/" onClick={() => setOpen(false)}>เปิดหน้าบ้าน</Link>
    </aside>}
  </>;
}
