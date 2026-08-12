import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Globe2, Search } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import { getSiteSettings } from "@/core/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: `เกี่ยวกับ — ${settings.siteName}`, description: settings.siteDescription };
}

export default async function AboutPage() {
  const [settings, contents, categories, tags] = await Promise.all([
    getSiteSettings(),
    contentRepository.listPublic(),
    contentRepository.listCategories(),
    contentRepository.listPublicTags(),
  ]);
  const publishedCount = contents.length;
  const totalTags = tags.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const profileStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: settings.siteName,
    description: settings.siteDescription,
    url: siteUrl ? `${siteUrl}/about` : undefined,
    mainEntity: {
      "@type": "Person",
      name: settings.siteName,
      description: settings.siteDescription,
      url: siteUrl || undefined,
    },
  };

  return <div className="container about-grid">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileStructuredData).replace(/</g, "\\u003c") }} />
    <aside className="about-portrait"><BookOpen size={90} /></aside>
    <section className="about-copy">
      <p className="eyebrow">About this space</p>
      <h1>{settings.siteName}</h1>
      <p>{settings.siteDescription}</p>

      <div className="about-stats">
        <div className="about-stat"><FileText size={18} /><strong>{publishedCount}</strong><span>บทความเผยแพร่</span></div>
        <div className="about-stat"><Globe2 size={18} /><strong>{categories.length}</strong><span>หมวดหมู่</span></div>
        <div className="about-stat"><Search size={18} /><strong>{totalTags}</strong><span>แท็ก</span></div>
      </div>

      {categories.length > 0 && <>
        <h2>หมวดหมู่</h2>
        <div className="about-categories">{categories.map((cat) => <Link href={`/categories/${cat.slug}`} key={cat.slug} className="about-category-chip" style={{ "--cat-color": cat.color } as React.CSSProperties}><span>{cat.name}</span></Link>)}</div>
      </>}

      {tags.length > 0 && <>
        <h2>แท็กที่ใช้บ่อย</h2>
        <div className="skill-cloud">{tags.slice(0, 20).map((tag) => <Link href={`/tags/${tag.slug}`} key={tag.slug}><span>{tag.name} ({tag.contentCount})</span></Link>)}</div>
      </>}

      <h2>หลักการของคลังนี้</h2>
      <p>Capture ให้เร็ว · Organize เท่าที่จำเป็น · Understand เมื่อกลับมาอ่าน · Retrieve ให้พบ · Improve อย่างปลอดภัย</p>
      <p className="muted" style={{ marginTop: "2rem", fontSize: ".82rem" }}>{settings.footerText}</p>
    </section>
  </div>;
}