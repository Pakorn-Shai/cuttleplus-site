import type { Metadata } from "next";
import { ListOrdered } from "lucide-react";
import type { CSSProperties } from "react";
import { CardListView } from "@/components/public/card-list-view";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = {
  title: "Series ทั้งหมด",
  description: "ชุดบทความสาธารณะที่จัดลำดับให้อ่านและเรียนรู้ต่อเนื่อง",
};

export default async function SeriesPage() {
  const series = await contentRepository.listPublicSeries();
  const items = series.map((item) => {
    const coverStyle: CSSProperties = item.coverUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.55)), url(${item.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center", color: "#fff" } : {};
    return {
      key: item.slug,
      href: `/series/${item.slug}`,
      icon: <ListOrdered size={20} />,
      title: item.name,
      subtitle: `${item.contentCount} บท${item.description ? ` · ${item.description}` : ""}`,
      style: { "--category": "var(--accent)", ...coverStyle } as CSSProperties,
    };
  });

  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Learning Series</p><h1>Series ทั้งหมด</h1><p>เรียนรู้ตามลำดับจากชุดบทความที่เชื่อมโยงกันตั้งแต่ต้นจนจบ</p></header>
    {items.length ? <CardListView items={items} storageKey="kh-series-view" /> : <div className="empty-state"><ListOrdered size={32} /><h2>ยังไม่มี Series Public</h2><p>Series จะปรากฏเมื่อกำหนดเป็น Public และมีบทความ Public อย่างน้อยหนึ่งบท</p></div>}
  </div>;
}