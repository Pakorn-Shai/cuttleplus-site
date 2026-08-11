import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const slug = resolvedParams.slug;
  const view = resolvedSearchParams.view === "list" ? "list" : "card";
  const [categories, allContent] = await Promise.all([
    contentRepository.listCategories(),
    contentRepository.listPublic(),
  ]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const contents = allContent.filter((content) => content.category.slug === slug);
  const featuredContents = contents.filter((c) => c.featured);
  const otherContents = contents.filter((c) => !c.featured);
  return <div className="container">
    <header className="page-hero">
      <p className="eyebrow">Category</p>
      <h1>{category.name}</h1>
      <p>บทความและบันทึกทั้งหมดในหมวด {category.name} ({contents.length} รายการ)</p>
    </header>
    <div className="library-toolbar"><div className="toolbar-inner">
      <div className="view-toggle">
        <Link href={`/categories/${slug}?view=card` as Route} className={view === "card" ? "active" : ""} aria-label="มุมมองการ์ด">▦</Link>
        <Link href={`/categories/${slug}?view=list` as Route} className={view === "list" ? "active" : ""} aria-label="มุมมองรายการ">☰</Link>
      </div>
      <span className="result-count">{contents.length} บทความ</span>
    </div></div>
    {featuredContents.length > 0 && <section className="category-featured"><h2 className="section-head"><span>เนื้อหาเด่น</span></h2><div className="content-grid">{featuredContents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div></section>}
    {contents.length ? view === "card" ? <div className="content-grid">{otherContents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div> : <div className="content-list">{otherContents.map((content) => <Link href={`/knowledge/${content.slug}` as Route} className="knowledge-list-item" key={content.id}><div className="list-icon" style={{ "--category": content.category.color } as React.CSSProperties}><span>{content.category.icon === "BookOpen" ? "📖" : "📁"}</span></div><div className="list-copy"><h3>{content.title}</h3><p>{content.excerpt}</p></div><div className="list-side"><span>{content.readingTime} นาที</span><span>{content.updatedAt}</span></div></Link>)}</div> : <div className="empty-state"><h2>ยังไม่มีบทความ Public</h2><p>เนื้อหาใหม่ในหมวดนี้จะปรากฏที่นี่หลังเผยแพร่</p></div>}
  </div>;
}
