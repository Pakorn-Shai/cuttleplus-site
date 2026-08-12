import type { Metadata } from "next";
import { Hash } from "lucide-react";
import type { CSSProperties } from "react";
import { CardListView } from "@/components/public/card-list-view";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = {
  title: "แท็กทั้งหมด",
  description: "สำรวจบทความสาธารณะจากคำสำคัญและหัวข้อที่เกี่ยวข้อง",
};

export default async function TagsPage() {
  const tags = await contentRepository.listPublicTags();
  const items = tags.map((tag) => ({
    key: tag.slug,
    href: `/tags/${tag.slug}`,
    icon: <Hash size={20} />,
    title: tag.name,
    subtitle: `${tag.contentCount} บทความ${tag.description ? ` · ${tag.description}` : ""}`,
    style: { "--category": "var(--accent)" } as CSSProperties,
  }));

  return <div className="container">
    <header className="page-hero"><p className="eyebrow">Browse Tags</p><h1>แท็กทั้งหมด</h1><p>ค้นพบเนื้อหาที่เกี่ยวข้องกันผ่านคำสำคัญ โดยแสดงเฉพาะแท็กที่มีบทความ Public</p></header>
    {items.length ? <CardListView items={items} storageKey="kh-tags-view" /> : <div className="empty-state"><Hash size={32} /><h2>ยังไม่มีแท็ก Public</h2><p>แท็กจะปรากฏเมื่อมีบทความ Public ที่ใช้แท็กนั้น</p></div>}
  </div>;
}