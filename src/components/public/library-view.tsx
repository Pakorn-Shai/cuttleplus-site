"use client";

import Link from "next/link";
import { BookText, Grid2X2, List, Search } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { KnowledgeContent } from "@/core/content/types";
import { KnowledgeCard } from "./knowledge-card";

export type ViewMode = "card" | "list";
export type DensityMode = "compact" | "standard" | "comfortable";

function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key) as T | null;
  return stored && valid.includes(stored) ? stored : fallback;
}

export function LibraryView({ contents, preFiltered = false, view: externalView, density: externalDensity }: { contents: KnowledgeContent[]; preFiltered?: boolean; view?: ViewMode; density?: DensityMode }) {
  const [internalView, setInternalView] = useState<ViewMode>(() => readStored("kh-library-view", ["card", "list"] as const, "card"));
  const [internalDensity, setInternalDensity] = useState<DensityMode>(() => readStored("kh-library-density", ["compact", "standard", "comfortable"] as const, "standard"));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const view = externalView ?? internalView;
  const density = externalDensity ?? internalDensity;

  function updateView(next: ViewMode) {
    setInternalView(next);
    window.localStorage.setItem("kh-library-view", next);
  }

  function updateDensity(next: DensityMode) {
    setInternalDensity(next);
    window.localStorage.setItem("kh-library-density", next);
  }

  const categories = useMemo(() => [...new Set(contents.map((content) => content.category.name))], [contents]);
  const filtered = useMemo(() => {
    if (preFiltered) return contents;
    return contents.filter((content) => {
      const matchesCategory = category === "all" || content.category.name === category;
      const haystack = `${content.title} ${content.excerpt} ${content.tags.join(" ")}`.toLocaleLowerCase("th");
      return matchesCategory && haystack.includes(query.toLocaleLowerCase("th"));
    });
  }, [contents, query, category, preFiltered]);

  return (
    <>
      {!preFiltered && (
        <div className="library-toolbar">
          <div className="container toolbar-inner">
            <label className="search-box"><span className="sr-only">ค้นหาในคลัง</span><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ เนื้อหา หรือ tag..." /></label>
            <select className="filter-select" aria-label="กรองตามหมวดหมู่" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">ทุกหมวดหมู่</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
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
        </div>
      )}
      <section className={`library-content container density-${density}`}>
        <p className="result-count">พบ {filtered.length} รายการ · เรียงตามอัปเดตล่าสุด</p>
        {filtered.length === 0 ? <div className="empty-state"><Search size={28} /><h2>ยังไม่พบเนื้อหาที่ตรงกัน</h2><p>ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น</p></div> : view === "card" ? (
          <div className={`content-grid density-${density}`}>{filtered.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div>
        ) : (
          <div className={`content-list density-${density}`}>{filtered.map((content) => <Link className="knowledge-list-item" href={`/knowledge/${content.slug}`} key={content.id}>
            <span className="list-icon" style={{ "--category": content.category.color } as CSSProperties}><BookText size={19} /></span>
            <span className="list-copy"><h3>{content.title}</h3><p>{content.excerpt}</p></span>
            <span className="list-side">{content.category.name}<br />{content.readingTime} นาที</span>
          </Link>)}</div>
        )}
      </section>
    </>
  );
}