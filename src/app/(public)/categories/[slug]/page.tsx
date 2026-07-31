import { notFound } from "next/navigation";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const categories = await contentRepository.listCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const contents = (await contentRepository.listPublic()).filter((content) => content.category.slug === slug);
  return <div className="container"><header className="page-hero"><p className="eyebrow">Category</p><h1>{category.name}</h1><p>บทความและบันทึกทั้งหมดในหมวด {category.name}</p></header>{contents.length ? <div className="content-grid">{contents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div> : <div className="empty-state"><h2>ยังไม่มีบทความ Public</h2><p>เนื้อหาใหม่ในหมวดนี้จะปรากฏที่นี่หลังเผยแพร่</p></div>}</div>;
}
