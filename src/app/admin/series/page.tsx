import { ListOrdered, Trash2 } from "lucide-react";
import { deleteSeriesAction, saveSeriesAction } from "@/app/admin/taxonomy/actions";
import { prisma } from "@/lib/prisma";

const errorMessages: Record<string, string> = {
  invalid: "ข้อมูล Series ไม่ถูกต้อง",
  invalid_order: "ลำดับบทต้องเป็นตัวเลขไม่ซ้ำกัน",
  duplicate: "ชื่อ slug นี้ถูกใช้งานแล้ว",
};

export default async function SeriesAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, seriesList, contents] = await Promise.all([
    searchParams,
    prisma.series.findMany({ include: { items: { include: { content: true }, orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.content.findMany({ where: { deletedAt: null }, select: { id: true, title: true, status: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Series</h2><p>จัดบทความเป็นลำดับการอ่าน เช่น หลักสูตรหรือบทเรียนต่อเนื่อง</p></div></header>
    {error && <div className="admin-alert">{errorMessages[error] ?? "ดำเนินการไม่สำเร็จ กรุณาลองใหม่"}</div>}
    <section className="admin-panel taxonomy-create"><div className="panel-head"><h3>สร้าง Series</h3></div><form action={saveSeriesAction} className="taxonomy-form panel-body">
      <label>ชื่อ<input name="name" required maxLength={120} /></label>
      <label>Slug<input name="slug" placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" maxLength={140} /></label>
      <label>การมองเห็น<select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option></select></label>
      <label className="wide">คำอธิบาย<textarea name="description" maxLength={600} /></label>
      <label className="wide">Cover URL<input name="coverUrl" placeholder="https://..." maxLength={2000} /></label>
      <button className="primary-button">สร้าง Series</button>
    </form></section>
    <section className="taxonomy-list">{seriesList.map((series) => {
      const positions = new Map(series.items.map((item) => [item.contentId, item.position + 1]));
      const selectedIds = new Set(positions.keys());
      const orderedContents = [
        ...series.items.map((item) => ({ id: item.content.id, title: item.content.title, status: item.content.status })),
        ...contents.filter((content) => !selectedIds.has(content.id)),
      ];
      return <details className="taxonomy-card collection-card" key={series.id}>
        <summary><span className="taxonomy-icon"><ListOrdered size={15} /></span><div><strong>{series.name}</strong><span>/{series.slug} · {series.items.length} บท · {series.visibility.toLowerCase()}</span></div><span>จัดการ</span></summary>
        <form action={saveSeriesAction} className="taxonomy-form taxonomy-edit">
          <input name="id" type="hidden" value={series.id} />
          <label>ชื่อ<input name="name" defaultValue={series.name} required /></label>
          <label>Slug<input name="slug" defaultValue={series.slug} required /></label>
          <label>การมองเห็น<select name="visibility" defaultValue={series.visibility}><option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option></select></label>
          <label className="wide">คำอธิบาย<textarea name="description" defaultValue={series.description ?? ""} /></label>
          <label className="wide">Cover URL<input name="coverUrl" defaultValue={series.coverUrl ?? ""} placeholder="https://..." maxLength={2000} /></label>
          <fieldset className="collection-picker series-picker wide"><legend>บทและลำดับการอ่าน</legend>{orderedContents.map((content, index) => <label key={content.id}>
            <input type="checkbox" name="contentIds" value={content.id} defaultChecked={selectedIds.has(content.id)} />
            <span>{content.title}<small>{content.status.toLowerCase()}</small></span>
            <input className="series-position" type="number" name={`position:${content.id}`} defaultValue={positions.get(content.id) ?? series.items.length + index + 1} min={1} max={9999} aria-label={`ลำดับของ ${content.title}`} />
          </label>)}</fieldset>
          <div className="taxonomy-actions"><button className="primary-button">บันทึก Series</button></div>
        </form>
        <form action={deleteSeriesAction} className="taxonomy-delete"><input name="id" type="hidden" value={series.id} /><button className="danger-button"><Trash2 size={14} /> ลบ Series</button></form>
      </details>;
    })}</section>
    {!seriesList.length && <div className="empty-state"><ListOrdered size={32} /><h3>ยังไม่มี Series</h3><p>สร้าง Series แล้วจึงเพิ่มบทและกำหนดลำดับการอ่าน</p></div>}
  </main>;
}
