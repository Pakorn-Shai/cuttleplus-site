import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, UserRound } from "lucide-react";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ArticleReader } from "@/components/public/article-reader";
import { contentRepository } from "@/core/content/repository";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await contentRepository.listPublishedRoutes()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = await contentRepository.findPublicBySlug((await params).slug);
  if (!content) return { title: "ไม่พบบทความ" };
  return { title: content.title, description: content.excerpt, alternates: { canonical: `/knowledge/${content.slug}` }, robots: content.visibility === "unlisted" ? { index: false, follow: false } : undefined, openGraph: { type: "article", title: content.title, description: content.excerpt, publishedTime: content.publishedAt, modifiedTime: content.updatedAt } };
}

export default async function ArticlePage({ params }: Props) {
  const slug = (await params).slug;
  const content = await contentRepository.findPublicBySlug(slug);
  if (!content) {
    const slugRedirect = await contentRepository.findSlugRedirect(slug);
    if (slugRedirect?.statusCode === 308) permanentRedirect(slugRedirect.targetPath as Route);
    if (slugRedirect) redirect(slugRedirect.targetPath as Route);
    notFound();
  }
  const structuredData = { "@context": "https://schema.org", "@type": content.type === "Tutorial" ? "TechArticle" : "Article", headline: content.title, description: content.excerpt, datePublished: content.publishedAt, dateModified: content.updatedAt, author: { "@type": "Person", name: "Knowledge Hub Owner" } };
  return <article className="article-shell">
    <aside className="article-toc"><h2>สารบัญ</h2>{content.headings.map((heading) => <a className={`toc-level-${heading.level}`} href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}</aside>
    <div className="article-main"><nav className="breadcrumbs" aria-label="เส้นทาง"><Link href="/">หน้าแรก</Link><ChevronRight size={12} /><Link href="/knowledge">คลังความรู้</Link><ChevronRight size={12} /><span>{content.category.name}</span></nav><header className="article-header"><span className="pill">{content.type}</span><h1>{content.title}</h1><p className="article-excerpt">{content.excerpt}</p><div className="tag-row">{content.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="article-meta"><span><UserRound size={13} /> Knowledge Hub</span><span><CalendarDays size={13} /> อัปเดต {content.updatedAt}</span><span><Clock size={13} /> อ่าน {content.readingTime} นาที</span></div></header><ArticleReader blocks={content.blocks} /><nav className="article-footer-nav"><Link href="/knowledge"><small>ย้อนกลับ</small>← คลังความรู้</Link><Link href="/search"><small>ค้นหาต่อ</small>เรื่องที่เกี่ยวข้อง →</Link></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></div>
  </article>;
}
