"use client";

import Link from "next/link";
import { BookOpen, Menu, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyColorMode, COLOR_MODE_EVENT, getPreferredColorMode, type ColorMode } from "@/lib/color-mode";

export function SiteHeader() {
  const [mode, setMode] = useState<ColorMode>("light");

  useEffect(() => {
    const syncMode = (event: Event) => setMode((event as CustomEvent<ColorMode>).detail);
    window.addEventListener(COLOR_MODE_EVENT, syncMode);
    applyColorMode(getPreferredColorMode(), false);
    return () => window.removeEventListener(COLOR_MODE_EVENT, syncMode);
  }, []);

  function toggleDark() {
    applyColorMode(mode === "dark" ? "light" : "dark");
  }

  return (
    <header className="public-header">
      <nav className="public-nav container" aria-label="เมนูหลัก">
        <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={18} /></span><span>Knowledge Hub</span></Link>
        <div className="nav-links">
          <Link href="/knowledge">คลังความรู้</Link>
          <Link href="/categories">หมวดหมู่</Link>
          <Link href="/search">ค้นหา</Link>
          <Link href="/about">เกี่ยวกับฉัน</Link>
        </div>
        <div className="nav-actions">
          <Link className="icon-button" href="/search" aria-label="ค้นหา"><Search size={17} /></Link>
          <button className="icon-button" onClick={toggleDark} aria-label={mode === "dark" ? "ใช้โหมดสว่าง" : "ใช้โหมดมืด"} aria-pressed={mode === "dark"}>{mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button className="icon-button mobile-menu" aria-label="เปิดเมนู"><Menu size={18} /></button>
        </div>
      </nav>
    </header>
  );
}
