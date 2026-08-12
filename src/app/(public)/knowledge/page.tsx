import type { Metadata } from "next";
import { KnowledgePageContent } from "@/components/public/knowledge-page-content";
import { contentRepository, type SearchSort } from "@/core/content/repository";

export const metadata: Metadata = { title: "คลังความรู้", description: "ค้นหาและสำรวจบทความ เทคนิค และบันทึกการเรียนรู้" };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string; tag?: string; sort?: string }> }) {
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
    return `/knowledge${qs ? `?${qs}` : ""}`;
  }

  return <KnowledgePageContent
    initialResults={results}
    q={q}
    typeFilter={typeFilter}
    categoryFilter={categoryFilter}
    tagFilter={tagFilter}
    sortParam={sortParam}
    categories={categories}
    tags={tags}
    activeFilters={activeFilters}
    clearUrl={searchUrl({ type: "", category: "", tag: "", sort: "" })}
  />;
}