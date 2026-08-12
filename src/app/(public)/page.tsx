import Link from "next/link";
import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Code2, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";

const categoryIcons = [ChartNoAxesColumnIncreasing, Code2, Sparkles, BookOpen];

export default async function HomePage() {
  const contents = await contentRepository.listPublic();
  const categories = await contentRepository.listCategories();
  return (
    <>
      <section className="hero"><div className="container hero-inner">
        <div><p className="eyebrow">Personal Knowledge Library</p><h1>เก็บสิ่งที่เรียนรู้<br /><em>ให้กลับมาเข้าใจได้เสมอ</em></h1><p className="hero-copy">พื้นที่สำหรับบันทึก จัดระเบียบ และเชื่อมโยงความรู้จากงานและสิ่งที่สนใจ — ออกแบบเพื่อการอ่านที่สบายและค้นพบได้ง่าย</p><div className="hero-actions"><Link className="primary-button" href="/knowledge">สำรวจคลังความรู้ <ArrowRight size={16} /></Link><Link className="secondary-button" href="/about">รู้จักฉันมากขึ้น</Link></div></div>
        <div className="knowledge-orbit" aria-hidden="true"><div className="orbit-center"><BookOpen size={70} /></div><span className="orbit-chip">SQL & Data</span><span className="orbit-chip">AI Notes</span><span className="orbit-chip">Programming</span><span className="orbit-chip">Learning</span></div>
      </div></section>
      <section className="section section-tint"><div className="container"><div className="section-head"><div><p className="eyebrow">Explore by topic</p><h2>เริ่มจากเรื่องที่สนใจ</h2></div><Link className="text-link" href="/categories">ดูทุกหมวดหมู่ →</Link></div><div className="category-grid">{categories.map((category, index) => { const Icon = categoryIcons[index]; return <Link href={`/categories/${category.slug}`} className="category-card" style={{ "--category": category.color } as CSSProperties} key={category.slug}><span className="category-icon"><Icon size={20} /></span><h3>{category.name}</h3><p>{contents.filter((item) => item.category.slug === category.slug).length} บทความ</p></Link>; })}</div></div></section>
      <section className="section"><div className="container"><div className="section-head"><div><p className="eyebrow">Recently updated</p><h2>ความรู้ที่อัปเดตล่าสุด</h2></div><Link className="text-link" href="/knowledge">เปิดคลังทั้งหมด →</Link></div><div className="content-grid">{contents.slice(0, 3).map((content) => <KnowledgeCard content={content} key={content.id} />)}</div></div></section>
    </>
  );
}