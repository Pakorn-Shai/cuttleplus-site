import type { Route } from "next";
import Link from "next/link";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository, type SearchSort } from "@/core/content/repository";

const typeLabels: Record<string, string> = {
  "Quick Note": "Quick Note", "Knowledge Note": "Knowledge Note", "Tutorial": "Tutorial",
  "Article": "Article", "Code Snippet": "Code Snippet", "Troubleshooting": "Troubleshooting",
  "Cheat Sheet": "Cheat Sheet", "Reference": "Reference", "Learning Log": "Learning Log",
  "Project Note": "Project Note", "Case Study": "Case Study", "Checklist": "Checklist",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string; tag?: string; sort?: string }> }) {
  const [query, categories, tags] = await Promise.all([
    searchParams,
    contentRepository.listCategories(),
    contentRepository.listPublicTags(),
  ]);
  const q = query.q ?? "";
  const typeFilter = query.type ?? "";
  const categoryFilter = query.category ?? "";
  const tagFilter = query.tag ?? "";
  const sortParam: SearchSort = query.sort === "updated" ? "updated" : "relevance";

  const results = await contentRepository.searchPublic(q, {
    sort: sortParam,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    tag: tagFilter || undefined,
  });

  const activeFilters: string[] = [];
  if (typeFilter) activeFilters.push(`ประเภท: ${typeFilter}`);
  if (categoryFilter) {
    const cat = categories.find((c) => c.slug === categoryFilter);
    activeFilters.push(`หมวดหมู่: ${cat?.name ?? categoryFilter}`);
  }
  if (tagFilter) activeFilters.push(`แท็ก: ${tagFilter}`);
  if (sortParam === "updated") activeFilters.push("เรียงตาม: อัปเดตล่าสุด");

  /** Build a helper URL preserving current q/filters except the one being changed */
  function searchUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (typeFilter && !("type" in overrides)) params.set("type", typeFilter);
    if (categoryFilter && !("category" in overrides)) params.set("category", categoryFilter);
    if (tagFilter && !("tag" in overrides)) params.set("tag", tagFilter);
    if (sortParam !== "relevance" && !("sort" in overrides)) params.set("sort", sortParam);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  return <div className="container">
    <header className="page-hero">
      <p className="eyebrow">Search</p>
      <h1>ค้นหาความรู้</h1>
      <p>ค้นจากชื่อ เนื้อหา code หมวดหมู่ tag และแหล่งอ้างอิง</p>
      <form className="search-page-form">
        <input name="q" defaultValue={q} autoFocus placeholder="เช่น SQL, Pandas, AI..." />
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
        <input type="hidden" name="sort" value={sortParam} />
        <button className="primary-button">ค้นหา</button>
      </form>
    </header>

    <form className="search-filters" method="get">
      <input type="hidden" name="q" value={q} />
      <select name="type" defaultValue={typeFilter}>
        <option value="">ทุกประเภท</option>
        {Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
      <select name="category" defaultValue={categoryFilter}>
        <option value="">ทุกหมวดหมู่</option>
        {categories.map((cat) => <option value={cat.slug} key={cat.slug}>{cat.name}</option>)}
      </select>
      <select name="tag" defaultValue={tagFilter}>
        <option value="">ทุกแท็ก</option>
        {tags.map((tag) => <option value={tag.name} key={tag.slug}>{tag.name} ({tag.contentCount})</option>)}
      </select>
      <select name="sort" defaultValue={sortParam}>
        <option value="relevance">เรียงตามความเกี่ยวข้อง</option>
        <option value="updated">เรียงตามอัปเดตล่าสุด</option>
      </select>
      <button className="secondary-button" type="submit">กรอง</button>
      {(typeFilter || categoryFilter || tagFilter || sortParam !== "relevance") && <Link href={searchUrl({ type: "", category: "", tag: "", sort: "" }) as Route} className="text-link">ล้าง</Link>}
    </form>

    {activeFilters.length > 0 && <div className="search-active-filters">
      {activeFilters.map((f) => <span className="tag" key={f}>{f}</span>)}
      <Link href={searchUrl({ type: "", category: "", tag: "", sort: "" }) as Route} className="text-link" style={{ fontSize: ".75rem" }}>ล้างตัวกรอง</Link>
    </div>}

    <p className="result-count">{q ? `ผลลัพธ์สำหรับ "${q}" — ${results.length} รายการ` : `เนื้อหาทั้งหมด ${results.length} รายการ`}</p>
    {results.length ? <div className="content-grid">{results.map((content) => <div key={content.id} className="search-result-card">
      <KnowledgeCard content={content} />
      {content.matchSnippet && <p className="search-snippet">{content.matchSnippet}</p>}
    </div>)}</div> : <div className="empty-state"><h2>ไม่พบเนื้อหา</h2><p>ลองใช้คำที่สั้นลงหรือค้นด้วยชื่อหมวดหมู่</p></div>}
  </div>;
}