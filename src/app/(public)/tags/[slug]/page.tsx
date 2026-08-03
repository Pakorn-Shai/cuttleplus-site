import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await contentRepository.findPublicTagBySlug((await params).slug);
  if (!tag) return { title: "ไม่พบแท็ก" };
  return {
    title: `แท็ก ${tag.name}`,
    description: tag.description || `บทความสาธารณะที่ใช้แท็ก ${tag.name}`,
    alternates: { canonical: `/tags/${tag.slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const slug = (await params).slug;
  const [tag, contents] = await Promise.all([
    contentRepository.findPublicTagBySlug(slug),
    contentRepository.listPublicByTag(slug),
  ]);
  if (!tag) notFound();

  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Tag</p><h1>#{tag.name}</h1><p>{tag.description || `บทความและบันทึกสาธารณะที่เกี่ยวข้องกับ ${tag.name}`}</p></header>
    <div className="content-grid">{contents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div>
  </div>;
}
