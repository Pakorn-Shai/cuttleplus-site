import Link from "next/link";
import { BookOpen, ChartNoAxesColumnIncreasing, Code2, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { DefaultHomeHero } from "@/components/public/default-home-hero";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";
import { getActiveThemeId, getSiteSettings } from "@/core/site/settings";
import { getPreviewThemeId } from "@/core/themes/preview";
import { getTheme } from "@/themes/registry";

const categoryIcons = [ChartNoAxesColumnIncreasing, Code2, Sparkles, BookOpen];

export default async function HomePage() {
  const [contents, categories, activeThemeId, previewThemeId, settings] = await Promise.all([
    contentRepository.listPublic(),
    contentRepository.listCategories(),
    getActiveThemeId(),
    getPreviewThemeId(),
    getSiteSettings(),
  ]);
  const theme = getTheme(previewThemeId ?? activeThemeId ?? process.env.NEXT_PUBLIC_THEME_ID);
  const HomeHero = theme.components.HomeHero ?? DefaultHomeHero;
  const categoryCounts = new Map(categories.map((category) => [category.slug, contents.filter((item) => item.category.slug === category.slug).length]));
  const heroCategories = categories.map((category) => ({ ...category, count: categoryCounts.get(category.slug) ?? 0 }));
  return (
    <>
      <HomeHero
        siteName={settings.siteName}
        siteDescription={settings.siteDescription}
        categories={heroCategories}
        totalContents={contents.length}
        recentTitles={contents.slice(0, 4).map((content) => content.title)}
      />
      <section className="section section-tint"><div className="container"><div className="section-head"><div><p className="eyebrow">Explore by topic</p><h2>เริ่มจากเรื่องที่สนใจ</h2></div><Link className="text-link" href="/categories">ดูทุกหมวดหมู่ →</Link></div><div className="category-grid">{categories.map((category, index) => { const Icon = categoryIcons[index % categoryIcons.length]; return <Link href={`/categories/${category.slug}`} className="category-card" style={{ "--category": category.color } as CSSProperties} key={category.slug}><span className="category-icon"><Icon size={20} /></span><h3>{category.name}</h3><p>{categoryCounts.get(category.slug) ?? 0} บทความ</p></Link>; })}</div></div></section>
      <section className="section"><div className="container"><div className="section-head"><div><p className="eyebrow">Recently updated</p><h2>ความรู้ที่อัปเดตล่าสุด</h2></div><Link className="text-link" href="/knowledge">เปิดคลังทั้งหมด →</Link></div><div className="content-grid">{contents.slice(0, 3).map((content) => <KnowledgeCard content={content} key={content.id} />)}</div></div></section>
    </>
  );
}