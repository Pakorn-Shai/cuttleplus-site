import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";
import { getSiteSettings } from "@/core/site/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await contentRepository.findOpenCollectionBySlug((await params).slug);
  if (!collection) return { title: "ไม่พบชุดความรู้" };
  return {
    title: collection.name,
    description: collection.description || `ชุดความรู้ ${collection.name} จำนวน ${collection.contentCount} รายการ`,
    alternates: { canonical: `/collections/${collection.slug}` },
    robots: collection.visibility === "unlisted" ? { index: false, follow: false } : undefined,
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const [collection, settings] = await Promise.all([
    contentRepository.findOpenCollectionBySlug((await params).slug),
    getSiteSettings(),
  ]);
  if (!collection) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description || `ชุดความรู้ ${collection.name}`,
    url: siteUrl ? `${siteUrl}/collections/${collection.slug}` : undefined,
    hasPart: collection.items.map(({ content }) => ({
      "@type": "CreativeWork",
      name: content.title,
      url: siteUrl ? `${siteUrl}/knowledge/${content.slug}` : undefined,
    })),
  };
  return <div className="container collection-public-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData).replace(/</g, "\\u003c") }} />
    <header className="page-hero"><p className="eyebrow">Collection · {collection.contentCount} รายการ</p><h1>{collection.name}</h1><p>{collection.description || "บทความที่คัดรวมไว้ในชุดความรู้นี้"}</p></header>
    <div className="content-grid">{collection.items.map(({ content, note }) => <div className="collection-public-item" key={content.id}><KnowledgeCard content={content} />{note && <p className="collection-public-note">{note}</p>}</div>)}</div>
  </div>;
}
