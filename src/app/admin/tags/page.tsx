import { Tags, Trash2 } from "lucide-react";
import { deleteTagAction, saveTagAction } from "@/app/admin/taxonomy/actions";
import { prisma } from "@/lib/prisma";

const errorMessages: Record<string, string> = { invalid: "ข้อมูลแท็กไม่ถูกต้อง", duplicate: "ชื่อ slug นี้ถูกใช้งานแล้ว", in_use: "ลบไม่ได้ เพราะยังมีเนื้อหาใช้แท็กนี้อยู่" };

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, tags] = await Promise.all([searchParams, prisma.tag.findMany({ include: { _count: { select: { contents: true, aliases: true } } }, orderBy: { name: "asc" } })]);
  return <main className="admin-content"><header className="admin-page-head"><div><h2>แท็ก</h2><p>ดูแลคำสำคัญที่ช่วยค้นหาและเชื่อมโยงเนื้อหา</p></div></header>
    {error && <div className="admin-alert">{errorMessages[error] ?? "ดำเนินการไม่สำเร็จ กรุณาลองใหม่"}</div>}
    <section className="admin-panel taxonomy-create"><div className="panel-head"><h3>สร้างแท็ก</h3></div><form action={saveTagAction} className="taxonomy-form panel-body"><label>ชื่อ<input name="name" required maxLength={120} /></label><label>Slug<input name="slug" placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" /></label><label className="wide">คำอธิบาย<textarea name="description" maxLength={600} /></label><button className="primary-button">เพิ่มแท็ก</button></form></section>
    <section className="taxonomy-list">{tags.map((tag) => <details className="taxonomy-card" key={tag.id}><summary><span className="taxonomy-icon"><Tags size={15} /></span><div><strong>{tag.name}</strong><span>/{tag.slug} · {tag._count.contents} เนื้อหา · {tag._count.aliases} alias</span></div><span>แก้ไข</span></summary><form action={saveTagAction} className="taxonomy-form taxonomy-edit"><input name="id" type="hidden" value={tag.id} /><label>ชื่อ<input name="name" defaultValue={tag.name} required /></label><label>Slug<input name="slug" defaultValue={tag.slug} required /></label><label className="wide">คำอธิบาย<textarea name="description" defaultValue={tag.description ?? ""} /></label><div className="taxonomy-actions"><button className="primary-button">บันทึก</button></div></form><form action={deleteTagAction} className="taxonomy-delete"><input name="id" type="hidden" value={tag.id} /><button className="danger-button"><Trash2 size={14} /> ลบแท็ก</button></form></details>)}</section>
    {!tags.length && <div className="empty-state"><Tags size={32} /><h3>ยังไม่มีแท็ก</h3></div>}
  </main>;
}
