import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryView } from "@/components/public/library-view";
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
  const [tag, contents, relatedTags] = await Promise.all([
    contentRepository.findPublicTagBySlug(slug),
    contentRepository.listPublicByTag(slug),
    contentRepository.findRelatedTags(slug),
  ]);
  if (!tag) notFound();

  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Tag</p><h1>#{tag.name}</h1><p>{tag.description || `บทความและบันทึกสาธารณะที่เกี่ยวข้องกับ ${tag.name}`}</p></header>
    {relatedTags.length > 0 && <div className="tag-related"><span className="tag-related-label">แท็กที่เกี่ยวข้อง:</span>{relatedTags.map((rt) => <Link href={`/tags/${rt.slug}` as Route} className="tag" key={rt.slug}>{rt.name} ({rt.contentCount})</Link>)}</div>}
    <LibraryView contents={contents} preFiltered />
  </div>;
}