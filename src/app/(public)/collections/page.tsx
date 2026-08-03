import type { Metadata, Route } from "next";
import Link from "next/link";
import { Boxes } from "lucide-react";
import type { CSSProperties } from "react";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = {
  title: "ชุดความรู้ทั้งหมด",
  description: "ชุดบทความสาธารณะที่รวบรวมตามหัวข้อหรือวัตถุประสงค์",
};

export default async function CollectionsPage() {
  const collections = await contentRepository.listPublicCollections();
  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Curated Collections</p><h1>ชุดความรู้ทั้งหมด</h1><p>สำรวจบทความที่คัดรวมไว้ตามหัวข้อ งาน หรือเป้าหมายการเรียนรู้</p></header>
    {collections.length ? <div className="category-grid">{collections.map((collection) => <Link href={`/collections/${collection.slug}` as Route} className="category-card" style={{ "--category": "var(--accent)" } as CSSProperties} key={collection.slug}>
      <span className="category-icon"><Boxes size={20} /></span><h3>{collection.name}</h3><p>{collection.contentCount} รายการ{collection.description ? ` · ${collection.description}` : ""}</p>
    </Link>)}</div> : <div className="empty-state"><Boxes size={32} /><h2>ยังไม่มีชุดความรู้ Public</h2><p>ชุดความรู้จะปรากฏเมื่อกำหนดเป็น Public และมีบทความ Public</p></div>}
  </div>;
}
