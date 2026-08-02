import { FolderTree, Trash2 } from "lucide-react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/taxonomy/actions";
import { prisma } from "@/lib/prisma";

const errorMessages: Record<string, string> = {
  invalid: "ข้อมูลหมวดหมู่ไม่ครบหรือรูปแบบไม่ถูกต้อง",
  invalid_parent: "ไม่สามารถเลือกหมวดลูกของตัวเองเป็นหมวดแม่ได้",
  duplicate: "ชื่อ slug นี้ถูกใช้งานแล้ว",
  in_use: "ลบไม่ได้ เพราะหมวดหมู่นี้ยังมีเนื้อหาหรือหมวดย่อยอยู่",
};

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, categories] = await Promise.all([
    searchParams,
    prisma.category.findMany({ include: { parent: true, _count: { select: { contents: true, children: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return <main className="admin-content"><header className="admin-page-head"><div><h2>หมวดหมู่</h2><p>จัดโครงสร้างหัวข้อหลักและหมวดย่อยที่ใช้กับเนื้อหา</p></div></header>
    {error && <div className="admin-alert">{errorMessages[error] ?? "ดำเนินการไม่สำเร็จ กรุณาลองใหม่"}</div>}
    <section className="admin-panel taxonomy-create"><div className="panel-head"><h3>สร้างหมวดหมู่</h3></div><form action={saveCategoryAction} className="taxonomy-form panel-body">
      <label>ชื่อ<input name="name" required maxLength={120} /></label><label>Slug<input name="slug" placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" /></label><label>สี<input name="color" type="color" defaultValue="#6d5dfc" /></label><label>ลำดับ<input name="sortOrder" type="number" min="0" defaultValue="0" /></label>
      <label className="wide">คำอธิบาย<textarea name="description" maxLength={600} /></label><label>หมวดแม่<select name="parentId"><option value="">ไม่มี</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><button className="primary-button" type="submit">เพิ่มหมวดหมู่</button>
    </form></section>
    <section className="taxonomy-list">{categories.map((category) => <details className="taxonomy-card" key={category.id}><summary><span className="taxonomy-color" style={{ background: category.color ?? "#6d5dfc" }} /><div><strong>{category.name}</strong><span>/{category.slug} · {category._count.contents} เนื้อหา · {category._count.children} หมวดย่อย{category.parent ? ` · ใต้ ${category.parent.name}` : ""}</span></div><span>แก้ไข</span></summary><form action={saveCategoryAction} className="taxonomy-form taxonomy-edit"><input name="id" type="hidden" value={category.id} /><label>ชื่อ<input name="name" defaultValue={category.name} required /></label><label>Slug<input name="slug" defaultValue={category.slug} required /></label><label>สี<input name="color" type="color" defaultValue={category.color ?? "#6d5dfc"} /></label><label>ลำดับ<input name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} /></label><label className="wide">คำอธิบาย<textarea name="description" defaultValue={category.description ?? ""} /></label><label>หมวดแม่<select name="parentId" defaultValue={category.parentId ?? ""}><option value="">ไม่มี</option>{categories.filter((candidate) => candidate.id !== category.id).map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><div className="taxonomy-actions"><button className="primary-button">บันทึก</button></div></form><form action={deleteCategoryAction} className="taxonomy-delete"><input name="id" type="hidden" value={category.id} /><button className="danger-button" aria-label={`ลบ ${category.name}`}><Trash2 size={14} /> ลบหมวดหมู่</button></form></details>)}</section>
    {!categories.length && <div className="empty-state"><FolderTree size={32} /><h3>ยังไม่มีหมวดหมู่</h3></div>}
  </main>;
}
