import { notFound } from "next/navigation";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { LibraryView } from "@/components/public/library-view";
import { contentRepository } from "@/core/content/repository";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
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
    {featuredContents.length > 0 && <section className="category-featured"><h2 className="section-head"><span>เนื้อหาเด่น</span></h2><div className="content-grid">{featuredContents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div></section>}
    {contents.length ? <LibraryView contents={otherContents} preFiltered /> : <div className="empty-state"><h2>ยังไม่มีบทความ Public</h2><p>เนื้อหาใหม่ในหมวดนี้จะปรากฏที่นี่หลังเผยแพร่</p></div>}
  </div>;
}