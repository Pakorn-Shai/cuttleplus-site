"use client";

import Link from "next/link";
import type { Route } from "next";
import { Grid2X2, List } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { LibraryView, type DensityMode, type ViewMode } from "./library-view";
import type { KnowledgeContent } from "@/core/content/types";

const typeLabels: Record<string, string> = {
  "Quick Note": "Quick Note", "Knowledge Note": "Knowledge Note", "Tutorial": "Tutorial",
  "Article": "Article", "Code Snippet": "Code Snippet", "Troubleshooting": "Troubleshooting",
  "Cheat Sheet": "Cheat Sheet", "Reference": "Reference", "Learning Log": "Learning Log",
  "Project Note": "Project Note", "Case Study": "Case Study", "Checklist": "Checklist",
};
const typeLabelEntries = Object.entries(typeLabels);

function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key) as T | null;
    return stored && valid.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

interface KnowledgePageContentProps {
  initialResults: KnowledgeContent[];
  q: string;
  typeFilter: string;
  categoryFilter: string;
  tagFilter: string;
  sortParam: string;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string; contentCount: number }[];
  activeFilters: string[];
  clearUrl: string;
}

export function KnowledgePageContent({ initialResults, q, typeFilter, categoryFilter, tagFilter, sortParam, categories, tags, activeFilters, clearUrl }: KnowledgePageContentProps) {
  const [view, setView] = useState<ViewMode>(() => readStored("kh-library-view", ["card", "list"] as const, "card"));
  const [density, setDensity] = useState<DensityMode>(() => readStored("kh-library-density", ["compact", "standard", "comfortable"] as const, "standard"));

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    e.target.form?.requestSubmit();
  }

  function updateView(next: ViewMode) {
    setView(next);
    window.localStorage.setItem("kh-library-view", next);
  }

  function updateDensity(next: DensityMode) {
    setDensity(next);
    window.localStorage.setItem("kh-library-density", next);
  }

  return <div className="container">
    <header className="page-hero">
      <p className="eyebrow">Knowledge Library</p>
      <h1>คลังความรู้</h1>
      <p>รวบรวมบทความ เทคนิค และบันทึกจากสิ่งที่ได้เรียนรู้ ใช้ตัวกรองหรือค้นหาสิ่งที่ต้องการได้ทันที</p>
      <form className="search-page-form">
        <input name="q" defaultValue={q} autoFocus placeholder="เช่น SQL, Pandas, AI..." />
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
        <input type="hidden" name="sort" value={sortParam} />
        <button className="primary-button">ค้นหา</button>
      </form>
    </header>

    <div className="search-filters">
      <form method="get" style={{ display: "contents" }}>
        <input type="hidden" name="q" value={q} />
        <select name="type" defaultValue={typeFilter} onChange={handleChange}>
          <option value="">ทุกประเภท</option>
          {typeLabelEntries.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <select name="category" defaultValue={categoryFilter} onChange={handleChange}>
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((cat) => <option value={cat.slug} key={cat.slug}>{cat.name}</option>)}
        </select>
        <select name="tag" defaultValue={tagFilter} onChange={handleChange}>
          <option value="">ทุกแท็ก</option>
          {tags.map((tag) => <option value={tag.name} key={tag.slug}>{tag.name} ({tag.contentCount})</option>)}
        </select>
        <select name="sort" defaultValue={sortParam} onChange={handleChange}>
          <option value="relevance">เรียงตามความเกี่ยวข้อง</option>
          <option value="updated">เรียงตามอัปเดตล่าสุด</option>
        </select>
        {(typeFilter || categoryFilter || tagFilter || sortParam !== "relevance") && <Link href={clearUrl as Route} className="text-link">ล้าง</Link>}
      </form>
      <div className="view-toggle" aria-label="รูปแบบการแสดงผล">
        <button className={view === "card" ? "active" : ""} onClick={() => updateView("card")} aria-label="มุมมองการ์ด"><Grid2X2 size={16} /></button>
        <button className={view === "list" ? "active" : ""} onClick={() => updateView("list")} aria-label="มุมมองรายการ"><List size={17} /></button>
      </div>
      <div className="density-toggle" aria-label="ความหนาแน่น">
        <button className={density === "compact" ? "active" : ""} onClick={() => updateDensity("compact")} aria-label="กะทัดรัด" title="Compact">S</button>
        <button className={density === "standard" ? "active" : ""} onClick={() => updateDensity("standard")} aria-label="ปกติ" title="Standard">M</button>
        <button className={density === "comfortable" ? "active" : ""} onClick={() => updateDensity("comfortable")} aria-label="สบายตา" title="Comfortable">L</button>
      </div>
    </div>

    {activeFilters.length > 0 && <div className="search-active-filters">
      {activeFilters.map((f) => <span className="tag" key={f}>{f}</span>)}
      <Link href={clearUrl as Route} className="text-link" style={{ fontSize: ".75rem" }}>ล้างตัวกรอง</Link>
    </div>}

    <LibraryView contents={initialResults} preFiltered view={view} density={density} />
  </div>;
}