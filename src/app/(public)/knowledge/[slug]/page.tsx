import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, ExternalLink, LinkIcon, UserRound } from "lucide-react";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ArticleReader } from "@/components/public/article-reader";
import { contentRepository } from "@/core/content/repository";
import { getSiteSettings } from "@/core/site/settings";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await contentRepository.listPublishedRoutes()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = await contentRepository.findPublicBySlug((await params).slug);
  if (!content) return { title: "ไม่พบบทความ" };
  const settings = await getSiteSettings();
  return {
    title: `${content.title} — ${settings.siteName}`,
    description: content.excerpt,
    alternates: { canonical: `/knowledge/${content.slug}` },
    robots: content.visibility === "unlisted" ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: content.title,
      description: content.excerpt,
      publishedTime: content.publishedAt,
      modifiedTime: content.updatedAt,
      siteName: settings.siteName,
      ...(settings.ogImageUrl ? { images: [{ url: settings.ogImageUrl, width: 1200, height: 630, alt: content.title }] } : {}),
      tags: content.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.excerpt,
      ...(settings.ogImageUrl ? { images: [settings.ogImageUrl] } : {}),
    },
  };
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
  const [seriesNavigation, siblingNavigation, settings] = await Promise.all([
    contentRepository.findPublicSeriesNavigation(content.id),
    contentRepository.findSiblingsBySlug(slug),
    getSiteSettings(),
  ]);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/knowledge/${content.slug}`;
  const wordCount = content.blocks.reduce((acc, block) => {
    if ("text" in block && typeof block.text === "string") return acc + block.text.split(/\s+/).length;
    if ("content" in block && typeof block.content === "string") return acc + block.content.split(/\s+/).length;
    return acc;
  }, 0);
  // Check for FAQ blocks to add FAQPage structured data
  const faqBlocks = content.blocks.filter((block) => block.type === "faq" && "items" in block && Array.isArray(block.items));
  const hasFaq = faqBlocks.length > 0;
  const structuredData: Record<string, unknown>[] = [
    { "@context": "https://schema.org", "@type": content.type === "Tutorial" ? "TechArticle" : "Article", headline: content.title, description: content.excerpt, url: articleUrl, datePublished: content.publishedAt, dateModified: content.updatedAt, wordCount, keywords: content.tags.length ? content.tags.join(", ") : undefined, author: { "@type": "Person", name: settings.siteName, url: siteUrl || undefined }, publisher: { "@type": "Organization", name: settings.siteName, url: siteUrl || undefined }, mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "คลังความรู้", item: `${siteUrl}/knowledge` },
      { "@type": "ListItem", position: 3, name: content.category.name, item: `${siteUrl}/categories/${content.category.slug}` },
      { "@type": "ListItem", position: 4, name: content.title },
    ] },
  ];
  if (hasFaq) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqBlocks.flatMap((block) => {
        const items = (block as { items: { question: string; answer: string }[] }).items;
        return items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        }));
      }),
    });
  }
  return <article className="article-shell">
    <aside className="article-toc"><h2>สารบัญ</h2>{content.headings.map((heading) => <a className={`toc-level-${heading.level}`} href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}</aside>
    <div className="article-main">
      <nav className="breadcrumbs" aria-label="เส้นทาง"><Link href="/">หน้าแรก</Link><ChevronRight size={12} /><Link href="/knowledge">คลังความรู้</Link><ChevronRight size={12} /><span>{content.category.name}</span></nav>
      <header className="article-header"><span className="pill">{content.type}</span><h1>{content.title}</h1><p className="article-excerpt">{content.excerpt}</p><div className="tag-row">{content.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="article-meta"><span><UserRound size={13} /> {settings.siteName}</span><span><CalendarDays size={13} /> อัปเดต {content.updatedAt}</span><span><Clock size={13} /> อ่าน {content.readingTime} นาที</span></div></header>
      <ArticleReader blocks={content.blocks} />
      {content.sources && content.sources.length > 0 && <section className="article-sources"><h2>แหล่งอ้างอิง</h2><ul>{content.sources.map((source) => <li key={source.id}><span className="source-status">{source.verified ? <CheckCircle2 size={14} /> : <LinkIcon size={14} />}</span><div><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url} <ExternalLink size={12} /></a>{source.author && <span className="source-meta">{source.author}{source.publisher && ` · ${source.publisher}`}</span>}{source.note && <span className="source-note">{source.note}</span>}</div></li>)}</ul></section>}
      {content.relatedContent && content.relatedContent.length > 0 && <section className="article-related"><h2>เนื้อหาที่เกี่ยวข้อง</h2><ul>{content.relatedContent.map((related) => <li key={related.id}><span className="relation-type">{related.relationType}</span><Link href={`/knowledge/${related.slug}`}>{related.title}</Link></li>)}</ul></section>}
      {seriesNavigation && <section className="article-series-nav"><header><small>Series · บทที่ {seriesNavigation.position}/{seriesNavigation.total}</small><Link href={`/series/${seriesNavigation.slug}` as Route}>{seriesNavigation.name}</Link></header><nav aria-label={`บทก่อนหน้าและถัดไปใน ${seriesNavigation.name}`}>{seriesNavigation.previous ? <Link href={`/knowledge/${seriesNavigation.previous.slug}` as Route}><small>← บทก่อนหน้า</small>{seriesNavigation.previous.title}</Link> : <span />}{seriesNavigation.next && <Link href={`/knowledge/${seriesNavigation.next.slug}` as Route}><small>บทถัดไป →</small>{seriesNavigation.next.title}</Link>}</nav></section>}
      {content.publishedAt && content.updatedAt !== content.publishedAt && <div className="article-revision-notice"><small>📝 อัปเดตล่าสุด {content.updatedAt}</small></div>}
      {!seriesNavigation && (siblingNavigation.previous || siblingNavigation.next) && <nav className="article-sibling-nav" aria-label="บทความก่อนหน้าและถัดไป">{siblingNavigation.previous ? <Link href={`/knowledge/${siblingNavigation.previous.slug}` as Route}><small>← บทความก่อนหน้า</small>{siblingNavigation.previous.title}</Link> : <span />}{siblingNavigation.next && <Link href={`/knowledge/${siblingNavigation.next.slug}` as Route}><small>บทความถัดไป →</small>{siblingNavigation.next.title}</Link>}</nav>}
      <nav className="article-footer-nav"><Link href="/knowledge"><small>ย้อนกลับ</small>← คลังความรู้</Link><Link href="/search"><small>ค้นหาต่อ</small>เรื่องที่เกี่ยวข้อง →</Link></nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </div>
  </article>;
}