import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Hash } from "lucide-react";
import type { CSSProperties } from "react";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = {
  title: "แท็กทั้งหมด",
  description: "สำรวจบทความสาธารณะจากคำสำคัญและหัวข้อที่เกี่ยวข้อง",
};

export default async function TagsPage() {
  const tags = await contentRepository.listPublicTags();

  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Browse Tags</p><h1>แท็กทั้งหมด</h1><p>ค้นพบเนื้อหาที่เกี่ยวข้องกันผ่านคำสำคัญ โดยแสดงเฉพาะแท็กที่มีบทความ Public</p></header>
    {tags.length ? <div className="category-grid">{tags.map((tag) => <Link href={`/tags/${tag.slug}` as Route} className="category-card" style={{ "--category": "var(--accent)" } as CSSProperties} key={tag.slug}>
      <span className="category-icon"><Hash size={20} /></span><h3>{tag.name}</h3><p>{tag.contentCount} บทความ{tag.description ? ` · ${tag.description}` : ""}</p>
    </Link>)}</div> : <div className="empty-state"><Hash size={32} /><h2>ยังไม่มีแท็ก Public</h2><p>แท็กจะปรากฏเมื่อมีบทความ Public ที่ใช้แท็กนั้น</p></div>}
  </div>;
}
