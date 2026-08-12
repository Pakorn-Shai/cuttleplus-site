import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { CSSProperties } from "react";
import { CardListView } from "@/components/public/card-list-view";
import { contentRepository } from "@/core/content/repository";

export default async function CategoriesPage() {
  const contents = await contentRepository.listPublic();
  const categories = await contentRepository.listCategories();
  const countByCategory = new Map<string, number>();
  for (const item of contents) {
    countByCategory.set(item.category.slug, (countByCategory.get(item.category.slug) ?? 0) + 1);
  }
  const items = categories.map((category) => ({
    key: category.slug,
    href: `/categories/${category.slug}`,
    icon: <FolderOpen size={20} />,
    title: category.name,
    subtitle: `${countByCategory.get(category.slug) ?? 0} บทความ`,
    style: { "--category": category.color } as CSSProperties,
  }));
  return <div className="container"><header className="page-hero"><p className="eyebrow">Browse Topics</p><h1>หมวดหมู่ทั้งหมด</h1><p>เริ่มสำรวจความรู้จากหัวข้อหลักที่ใช้จัดระเบียบเนื้อหา</p></header><CardListView items={items} storageKey="kh-categories-view" /></div>;
}