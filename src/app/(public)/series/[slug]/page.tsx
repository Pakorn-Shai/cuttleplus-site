import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { SeriesProgress } from "@/components/public/series-progress";
import { contentRepository } from "@/core/content/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const series = await contentRepository.findOpenSeriesBySlug((await params).slug);
  if (!series) return { title: "ไม่พบ Series" };
  return {
    title: series.name,
    description: series.description || `Series ${series.name} จำนวน ${series.contentCount} บท`,
    alternates: { canonical: `/series/${series.slug}` },
    robots: series.visibility === "unlisted" ? { index: false, follow: false } : undefined,
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const series = await contentRepository.findOpenSeriesBySlug((await params).slug);
  if (!series) notFound();
  return <div className="container series-page">
    <header className="page-hero"><p className="eyebrow">Learning Series · {series.contentCount} บท</p><h1>{series.name}</h1><p>{series.description || "อ่านบทความตามลำดับเพื่อเชื่อมความรู้ตั้งแต่พื้นฐานจนจบ Series"}</p><SeriesProgress seriesSlug={series.slug} totalItems={series.items.length} itemSlugs={series.items.map((item) => item.slug)} /></header>
    <ol className="series-lesson-list">{series.items.map((content, index) => <li key={content.id}>
      <Link href={`/knowledge/${content.slug}` as Route}>
        <span className="series-lesson-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="series-lesson-copy"><small>{content.category.name} · {content.type}</small><strong>{content.title}</strong><span>{content.excerpt}</span></span>
        <span className="series-lesson-meta"><span><Clock size={12} /> {content.readingTime} นาที</span><ArrowRight size={17} /></span>
      </Link>
    </li>)}</ol>
    <div className="series-start"><BookOpen size={18} /><div><strong>เริ่มอ่าน Series</strong><span>เริ่มจากบทแรกและอ่านต่อไปตามลำดับ</span></div><Link className="primary-button" href={`/knowledge/${series.items[0].slug}` as Route}>เริ่มบทที่ 1 <ArrowRight size={14} /></Link></div>
  </div>;
}
