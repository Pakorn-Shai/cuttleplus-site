import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ThemeHomeHeroProps } from "@/core/themes/contracts";

function pad(number: number) {
  return String(number).padStart(2, "0");
}

/**
 * Editorial front page: a magazine-style masthead with a numbered index of
 * categories and a "recently filed" column, separated by hairline rules.
 */
export function EditorialHero({ siteDescription, categories, totalContents, recentTitles }: ThemeHomeHeroProps) {
  return (
    <section className="ed-hero">
      <div className="container">
        <div className="ed-hero-kicker">
          <span>ฉบับคลังความรู้</span>
          <span>{totalContents} รายการที่บันทึกไว้</span>
        </div>
        <h1 className="ed-hero-title">สิ่งที่เรียนรู้<br />ไม่เคยหายไปไหน</h1>
        <p className="ed-hero-lede">{siteDescription || "พื้นที่สำหรับบันทึก จัดระเบียบ และเชื่อมโยงความรู้จากงานและสิ่งที่สนใจ"}</p>
        <div className="ed-hero-actions">
          <Link className="ed-hero-cta" href="/knowledge">เปิดคลังความรู้ <ArrowRight size={15} /></Link>
          <Link className="ed-hero-cta secondary" href="/about">เกี่ยวกับผู้เขียน</Link>
        </div>
        <div className="ed-hero-columns">
          <div className="ed-hero-column">
            <h2 className="ed-hero-column-title">ในฉบับนี้ · หมวดหมู่</h2>
            <ol className="ed-index">
              {categories.slice(0, 6).map((category, index) => (
                <li key={category.slug}>
                  <Link href={`/categories/${category.slug}`}>
                    <span className="ed-index-number">{pad(index + 1)}</span>
                    <span className="ed-index-name">{category.name}</span>
                    <span className="ed-index-count">{category.count} เรื่อง</span>
                  </Link>
                </li>
              ))}
              {categories.length === 0 && <li className="ed-index-empty">ยังไม่มีหมวดหมู่</li>}
            </ol>
          </div>
          <div className="ed-hero-column">
            <h2 className="ed-hero-column-title">บันทึกล่าสุด</h2>
            <ul className="ed-recent">
              {recentTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
              {recentTitles.length === 0 && <li className="ed-index-empty">ยังไม่มีบันทึก</li>}
            </ul>
            <Link className="ed-hero-cta" href="/knowledge" style={{ marginTop: 14 }}>ดูทั้งหมด <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}