import type { Metadata, Route } from "next";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import type { CSSProperties } from "react";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = {
  title: "Series ทั้งหมด",
  description: "ชุดบทความสาธารณะที่จัดลำดับให้อ่านและเรียนรู้ต่อเนื่อง",
};

export default async function SeriesPage() {
  const series = await contentRepository.listPublicSeries();
  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Learning Series</p><h1>Series ทั้งหมด</h1><p>เรียนรู้ตามลำดับจากชุดบทความที่เชื่อมโยงกันตั้งแต่ต้นจนจบ</p></header>
    {series.length ? <div className="category-grid">{series.map((item) => <Link href={`/series/${item.slug}` as Route} className="category-card" style={{ "--category": "var(--accent)" } as CSSProperties} key={item.slug}>
      <span className="category-icon"><ListOrdered size={20} /></span><h3>{item.name}</h3><p>{item.contentCount} บท{item.description ? ` · ${item.description}` : ""}</p>
    </Link>)}</div> : <div className="empty-state"><ListOrdered size={32} /><h2>ยังไม่มี Series Public</h2><p>Series จะปรากฏเมื่อกำหนดเป็น Public และมีบทความ Public อย่างน้อยหนึ่งบท</p></div>}
  </div>;
}
