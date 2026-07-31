import type { Metadata } from "next";
import { LibraryView } from "@/components/public/library-view";
import { contentRepository } from "@/core/content/repository";

export const metadata: Metadata = { title: "คลังความรู้", description: "ค้นหาและสำรวจบทความ เทคนิค และบันทึกการเรียนรู้" };

export default async function KnowledgePage() {
  const contents = await contentRepository.listPublic();
  return <><header className="page-hero container"><p className="eyebrow">Knowledge Library</p><h1>คลังความรู้</h1><p>รวบรวมบทความ เทคนิค และบันทึกจากสิ่งที่ได้เรียนรู้ ใช้ตัวกรองหรือค้นหาสิ่งที่ต้องการได้ทันที</p></header><LibraryView contents={contents} /></>;
}
