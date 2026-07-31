"use client";

import Link from "next/link";
import { BookText, Grid2X2, List, Search } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { KnowledgeContent } from "@/core/content/types";
import { KnowledgeCard } from "./knowledge-card";

type ViewMode = "card" | "list";

export function LibraryView({ contents }: { contents: KnowledgeContent[] }) {
  const [view, setView] = useState<ViewMode>("card");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  function updateView(next: ViewMode) {
    setView(next);
    window.localStorage.setItem("kh-library-view", next);
  }

  const categories = [...new Set(contents.map((content) => content.category.name))];
  const filtered = useMemo(() => contents.filter((content) => {
    const matchesCategory = category === "all" || content.category.name === category;
    const haystack = `${content.title} ${content.excerpt} ${content.tags.join(" ")}`.toLocaleLowerCase("th");
    return matchesCategory && haystack.includes(query.toLocaleLowerCase("th"));
  }), [contents, query, category]);

  return (
    <>
      <div className="library-toolbar">
        <div className="container toolbar-inner">
          <label className="search-box"><span className="sr-only">ค้นหาในคลัง</span><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ เนื้อหา หรือ tag..." /></label>
          <select className="filter-select" aria-label="กรองตามหมวดหมู่" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">ทุกหมวดหมู่</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <div className="view-toggle" aria-label="รูปแบบการแสดงผล">
            <button className={view === "card" ? "active" : ""} onClick={() => updateView("card")} aria-label="มุมมองการ์ด"><Grid2X2 size={16} /></button>
            <button className={view === "list" ? "active" : ""} onClick={() => updateView("list")} aria-label="มุมมองรายการ"><List size={17} /></button>
          </div>
        </div>
      </div>
      <section className="library-content container">
        <p className="result-count">พบ {filtered.length} รายการ · เรียงตามอัปเดตล่าสุด</p>
        {filtered.length === 0 ? <div className="empty-state"><Search size={28} /><h2>ยังไม่พบเนื้อหาที่ตรงกัน</h2><p>ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น</p></div> : view === "card" ? (
          <div className="content-grid">{filtered.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div>
        ) : (
          <div className="content-list">{filtered.map((content) => <Link className="knowledge-list-item" href={`/knowledge/${content.slug}`} key={content.id}>
            <span className="list-icon" style={{ "--category": content.category.color } as CSSProperties}><BookText size={19} /></span>
            <span className="list-copy"><h3>{content.title}</h3><p>{content.excerpt}</p></span>
            <span className="list-side">{content.category.name}<br />{content.readingTime} นาที</span>
          </Link>)}</div>
        )}
      </section>
    </>
  );
}
