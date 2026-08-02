import { Boxes, Trash2 } from "lucide-react";
import { deleteCollectionAction, saveCollectionAction } from "@/app/admin/taxonomy/actions";
import { prisma } from "@/lib/prisma";

const errorMessages: Record<string, string> = { invalid: "ข้อมูลชุดความรู้ไม่ถูกต้อง", duplicate: "ชื่อ slug นี้ถูกใช้งานแล้ว" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, collections, contents] = await Promise.all([
    searchParams,
    prisma.collection.findMany({ include: { items: { include: { content: true }, orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.content.findMany({ where: { deletedAt: null }, select: { id: true, title: true, status: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return <main className="admin-content"><header className="admin-page-head"><div><h2>ชุดความรู้</h2><p>รวมเนื้อหาหลายชิ้นเป็นชุดอ่านตามหัวข้อ โดยไม่เปลี่ยนหมวดหมู่เดิม</p></div></header>
    {error && <div className="admin-alert">{errorMessages[error] ?? "ดำเนินการไม่สำเร็จ กรุณาลองใหม่"}</div>}
    <section className="admin-panel taxonomy-create"><div className="panel-head"><h3>สร้างชุดความรู้</h3></div><form action={saveCollectionAction} className="taxonomy-form panel-body"><label>ชื่อ<input name="name" required /></label><label>Slug<input name="slug" placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" /></label><label>การมองเห็น<select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option></select></label><label className="wide">คำอธิบาย<textarea name="description" /></label><button className="primary-button">สร้างชุดความรู้</button></form></section>
    <section className="taxonomy-list">{collections.map((collection) => { const selected = new Set(collection.items.map((item) => item.contentId)); return <details className="taxonomy-card collection-card" key={collection.id}><summary><span className="taxonomy-icon"><Boxes size={15} /></span><div><strong>{collection.name}</strong><span>/{collection.slug} · {collection.items.length} เนื้อหา · {collection.visibility.toLowerCase()}</span></div><span>จัดการ</span></summary><form action={saveCollectionAction} className="taxonomy-form taxonomy-edit"><input name="id" type="hidden" value={collection.id} /><label>ชื่อ<input name="name" defaultValue={collection.name} required /></label><label>Slug<input name="slug" defaultValue={collection.slug} required /></label><label>การมองเห็น<select name="visibility" defaultValue={collection.visibility}><option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option></select></label><label className="wide">คำอธิบาย<textarea name="description" defaultValue={collection.description ?? ""} /></label><fieldset className="collection-picker wide"><legend>เนื้อหาในชุด</legend>{contents.map((content) => <label key={content.id}><input type="checkbox" name="contentIds" value={content.id} defaultChecked={selected.has(content.id)} /><span>{content.title}<small>{content.status.toLowerCase()}</small></span></label>)}</fieldset><div className="taxonomy-actions"><button className="primary-button">บันทึกชุดความรู้</button></div></form><form action={deleteCollectionAction} className="taxonomy-delete"><input name="id" type="hidden" value={collection.id} /><button className="danger-button"><Trash2 size={14} /> ลบชุดความรู้</button></form></details>; })}</section>
    {!collections.length && <div className="empty-state"><Boxes size={32} /><h3>ยังไม่มีชุดความรู้</h3></div>}
  </main>;
}
