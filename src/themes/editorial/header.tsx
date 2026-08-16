"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ThemeHeaderProps } from "@/core/themes/contracts";
import { applyColorMode, COLOR_MODE_EVENT, getPreferredColorMode, type ColorMode } from "@/lib/color-mode";

const fallbackNav = [
  { label: "คลังความรู้", url: "/knowledge", visible: true },
  { label: "หมวดหมู่", url: "/categories", visible: true },
  { label: "แท็ก", url: "/tags", visible: true },
  { label: "Series", url: "/series", visible: true },
  { label: "เกี่ยวกับฉัน", url: "/about", visible: true },
];

function todayLabel() {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date());
  } catch {
    return "";
  }
}

export function EditorialHeader({ siteName, navigationItems }: ThemeHeaderProps) {
  const [mode, setMode] = useState<ColorMode>("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncMode = (event: Event) => setMode((event as CustomEvent<ColorMode>).detail);
    window.addEventListener(COLOR_MODE_EVENT, syncMode);
    applyColorMode(getPreferredColorMode(), false);
    return () => window.removeEventListener(COLOR_MODE_EVENT, syncMode);
  }, []);

  const items = navigationItems.length > 0 ? navigationItems.filter((item) => item.visible) : fallbackNav;

  return (
    <header className="ed-header">
      <div className="ed-masthead container">
        <p className="ed-masthead-meta">{todayLabel()}</p>
        <Link className="ed-masthead-title" href="/">{siteName}</Link>
        <p className="ed-masthead-tag">คลังความรู้ส่วนบุคคล · อ่านง่าย ค้นพบเสมอ</p>
      </div>
      <nav className="ed-navbar" aria-label="เมนูหลัก">
        <div className="container ed-navbar-inner">
          <button
            className="ed-navbar-mobile-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="ed-nav-links"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />} เมนู
          </button>
          <div className={`ed-nav-links ${menuOpen ? "open" : ""}`} id="ed-nav-links">
            {items.map((item) => (
              <Link key={item.url} href={item.url as Route} onClick={() => setMenuOpen(false)}>{item.label}</Link>
            ))}
          </div>
          <button
            className="ed-mode-toggle"
            onClick={() => applyColorMode(mode === "dark" ? "light" : "dark")}
            aria-label={mode === "dark" ? "ใช้โหมดสว่าง" : "ใช้โหมดมืด"}
            aria-pressed={mode === "dark"}
          >
            {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{mode === "dark" ? "โหมดสว่าง" : "โหมดมืด"}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}