import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { CSSProperties } from "react";
import { contentRepository } from "@/core/content/repository";

export default async function CategoriesPage() {
  const contents = await contentRepository.listPublic();
  const categories = await contentRepository.listCategories();
  return <div className="container"><header className="page-hero"><p className="eyebrow">Browse Topics</p><h1>หมวดหมู่ทั้งหมด</h1><p>เริ่มสำรวจความรู้จากหัวข้อหลักที่ใช้จัดระเบียบเนื้อหา</p></header><div className="category-grid">{categories.map((category) => <Link href={`/categories/${category.slug}`} className="category-card" style={{ "--category": category.color } as CSSProperties} key={category.slug}><span className="category-icon"><FolderOpen size={20} /></span><h3>{category.name}</h3><p>{contents.filter((item) => item.category.slug === category.slug).length} บทความ</p></Link>)}</div></div>;
}
