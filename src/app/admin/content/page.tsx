import type { Route } from "next";
import Link from "next/link";
import { Archive, CalendarClock, Copy, Globe2, LayoutGrid, LayoutList, Pencil, Search, Trash2, X } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import { bulkUpdateContentAction, clearContentScheduleAction, deleteContentAction, duplicateContentAction, setContentScheduleAction, updateContentStatusAction } from "./actions";

const resultMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  publish: { tone: "success", text: "เผยแพร่บทความแล้ว และตั้ง Visibility เป็น Public ให้อัตโนมัติหากเดิมเป็น Private" },
  draft: { tone: "success", text: "เปลี่ยนบทความกลับเป็น Draft แล้ว" },
  archive: { tone: "success", text: "เก็บบทความเข้าคลังแล้ว" },
  restore: { tone: "success", text: "กู้บทความจากคลังกลับมาเป็น Draft แล้ว" },
  scheduled: { tone: "success", text: "ตั้งเวลาเผยแพร่เรียบร้อย ระบบจะเผยแพร่ให้อัตโนมัติเมื่อถึงกำหนด" },
  unscheduled: { tone: "success", text: "ยกเลิกการตั้งเวลาเผยแพร่ และกลับเป็น Draft แล้ว" },
  deleted: { tone: "success", text: "ลบบทความแล้ว (soft-delete — ข้อมูลยังอยู่ในฐานข้อมูล)" },
  bulk_delete: { tone: "success", text: "ลบบทความที่เลือกแล้ว (soft-delete)" },
  bulk_archive: { tone: "success", text: "เก็บบทความที่เลือกเข้าคลังแล้ว" },
  bulk_publish: { tone: "success", text: "เผยแพร่บทความที่เลือกแล้ว" },
  incomplete: { tone: "error", text: "ยังเผยแพร่/ตั้งเวลาไม่ได้: บทความต้องมีชื่อ slug และเนื้อหาอย่างน้อยหนึ่งย่อหน้า" },
  not_found: { tone: "error", text: "ไม่พบบทความที่ต้องการเปลี่ยนสถานะ" },
  invalid: { tone: "error", text: "คำขอเปลี่ยนสถานะไม่ถูกต้อง" },
};

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ result?: string; q?: string; status?: string; visibility?: string; view?: string }> }) {
  const [contents, query] = await Promise.all([contentRepository.listAll(), searchParams]);
  const message = query.result ? resultMessages[query.result] : undefined;
  const search = query.q?.trim().toLocaleLowerCase("th") ?? "";
  const allowedStatuses = new Set(["inbox", "draft", "scheduled", "published", "archived"]);
  const allowedVisibilities = new Set(["private", "unlisted", "public"]);
  const status = query.status && allowedStatuses.has(query.status) ? query.status : "";
  const visibility = query.visibility && allowedVisibilities.has(query.visibility) ? query.visibility : "";
  const view = query.view === "card" ? "card" : "table";
  const filtered = contents.filter((content) => {
    if (status && content.status !== status) return false;
    if (visibility && content.visibility !== visibility) return false;
    if (!search) return true;
    return [content.title, content.slug, content.excerpt, content.category.name, ...content.tags, JSON.stringify(content.blocks)].join(" ").toLocaleLowerCase("th").includes(search);
  });

  /** Build a URL preserving current filters */
  function contentUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (status) params.set("status", status);
    if (visibility) params.set("visibility", visibility);
    for (const [k, v] of Object.entries(overrides)) { if (v) params.set(k, v); }
    const qs = params.toString();
    return `/admin/content${qs ? `?${qs}` : ""}` as Route;
  }

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>เนื้อหาทั้งหมด</h2><p>ค้นหา กรอง และจัดการวงจรชีวิตของความรู้</p></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><div className="view-toggle"><Link href={contentUrl({ view: "card" })} className={view === "card" ? "active" : ""} aria-label="มุมมองการ์ด"><LayoutGrid size={16} /></Link><Link href={contentUrl({ view: "table" })} className={view === "table" ? "active" : ""} aria-label="มุมมองตาราง"><LayoutList size={16} /></Link></div><Link className="primary-button" href="/admin/content/new">+ สร้างบทความ</Link></div></header>
    {message && <p className={`admin-notice ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    <form className="admin-filters" method="get"><input type="hidden" name="view" value={view} /><label className="search-box"><span className="sr-only">ค้นหาเนื้อหา</span><Search size={15} /><input className="admin-search" name="q" defaultValue={query.q} placeholder="ค้นหาชื่อ เนื้อหา หรือ tag..." /></label><select className="filter-select" name="status" defaultValue={status}><option value="">ทุกสถานะ</option><option value="inbox">Inbox</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select><select className="filter-select" name="visibility" defaultValue={visibility}><option value="">ทุก Visibility</option><option value="public">Public</option><option value="private">Private</option><option value="unlisted">Unlisted</option></select><button className="secondary-button" type="submit">กรอง</button>{(search || status || visibility) && <Link className="text-link" href={contentUrl({ q: "", status: "", visibility: "" })}>ล้าง</Link>}</form>
    <p className="admin-result-count">แสดง {filtered.length} จาก {contents.length} รายการ</p>

    {view === "card" ? <div className="admin-content-grid">{filtered.map((content) => {
      const lifecycleAction = content.status === "archived" ? "restore" : content.status === "published" ? "draft" : "publish";
      const lifecycleLabel = content.status === "archived" ? "กู้เป็น Draft" : content.status === "published" ? "กลับเป็น Draft" : "เผยแพร่";
      return <article className="admin-content-card" key={content.id}>
        <div className="admin-content-card-header">
          <span className={`status-badge ${content.status}`}>{content.status}</span>
          <span className={`status-badge ${content.visibility}`}>{content.visibility}</span>
        </div>
        <Link href={`/admin/content/${content.id}/edit` as Route}><h3>{content.title}</h3></Link>
        <p>{content.excerpt || "ไม่มีคำอธิบาย"}</p>
        <div className="admin-content-card-meta">
          <span>{content.type}</span>
          <span>{content.category.name}</span>
          <span>{content.updatedAt}</span>
        </div>
        <div className="admin-content-card-actions">
          <Link className="icon-button" href={`/admin/content/${content.id}/edit` as Route} aria-label="แก้ไข" title="แก้ไข"><Pencil size={14} /></Link>
          <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value={lifecycleAction} /><button className="status-action-button" type="submit"><Globe2 size={13} /> {lifecycleLabel}</button></form>
          {content.status !== "archived" && <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value="archive" /><button className="icon-button" type="submit" aria-label="เก็บถาวร" title="เก็บถาวร"><Archive size={14} /></button></form>}
          <form action={duplicateContentAction}><input type="hidden" name="contentId" value={content.id} /><button className="icon-button" type="submit" aria-label="ทำสำเนา" title="ทำสำเนา"><Copy size={14} /></button></form>
          <form action={deleteContentAction}><input type="hidden" name="contentId" value={content.id} /><button className="icon-button" type="submit" aria-label="ลบ" title="ลบ"><Trash2 size={14} /></button></form>
        </div>
      </article>;
    })}{!filtered.length && <div className="empty-state" style={{ gridColumn: "1 / -1" }}><Search size={28} /><h3>ไม่พบเนื้อหาที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนคำค้น สถานะ หรือ Visibility</p></div>}</div>

    : <form action={bulkUpdateContentAction}>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th style={{ width: 32 }}><span className="sr-only">เลือก</span></th><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th>Visibility</th><th>หมวดหมู่</th><th>อัปเดต</th><th>จัดการ</th></tr></thead><tbody>{filtered.map((content) => {
      const isScheduled = content.status === "scheduled";
      const canSchedule = content.status === "draft" || content.status === "inbox";
      const lifecycleAction = content.status === "archived" ? "restore" : content.status === "published" ? "draft" : "publish";
      const lifecycleLabel = content.status === "archived" ? "กู้เป็น Draft" : content.status === "published" ? "กลับเป็น Draft" : "เผยแพร่";
      return <tr key={content.id}>
      <td><input type="checkbox" name="ids" value={content.id} aria-label={`เลือก ${content.title}`} style={{ width: 16, minHeight: 16 }} /></td>
      <td className="admin-table-title"><Link href={`/admin/content/${content.id}/edit` as Route}><strong>{content.title}</strong><span>/{content.slug}</span></Link></td>
      <td>{content.type}</td><td><span className={`status-badge ${content.status}`}>{content.status}</span>{isScheduled && content.scheduledAt && <span className="schedule-when"><CalendarClock size={12} /> {formatScheduled(content.scheduledAt)}</span>}</td><td><span className={`status-badge ${content.visibility}`}>{content.visibility}</span></td><td>{content.category.name}</td><td>{content.updatedAt}</td>
      <td><div className="table-actions">
        <Link className="icon-button" href={`/admin/content/${content.id}/edit` as Route} aria-label="แก้ไข" title="แก้ไข"><Pencil size={14} /></Link>
        {isScheduled ? <form action={clearContentScheduleAction}><input type="hidden" name="contentId" value={content.id} /><button className="status-action-button" type="submit"><X size={14} /> ยกเลิกการตั้งเวลา</button></form> : <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value={lifecycleAction} /><button className="status-action-button" type="submit"><Globe2 size={14} /> {lifecycleLabel}</button></form>}
        {canSchedule && <form className="schedule-form" action={setContentScheduleAction}><input type="hidden" name="contentId" value={content.id} /><input type="datetime-local" name="scheduledAt" required aria-label="เวลาที่ต้องการเผยแพร่" /><button className="status-action-button" type="submit"><CalendarClock size={14} /> ตั้งเวลา</button></form>}
        {content.status !== "archived" && <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value="archive" /><button className="icon-button" type="submit" aria-label="เก็บถาวร" title="เก็บถาวร"><Archive size={14} /></button></form>}
        <form action={duplicateContentAction}><input type="hidden" name="contentId" value={content.id} /><button className="icon-button" type="submit" aria-label="ทำสำเนา" title="ทำสำเนา"><Copy size={14} /></button></form>
        <form action={deleteContentAction}><input type="hidden" name="contentId" value={content.id} /><button className="icon-button" type="submit" aria-label="ลบ" title="ลบ" onClick={(e) => { if (!confirm(`ลบ "${content.title}"? ข้อมูลจะถูก soft-delete และสามารถกู้คืนได้`)) e.preventDefault(); }}><Trash2 size={14} /></button></form>
      </div></td>
    </tr>; })}</tbody></table>{!filtered.length && <div className="empty-state admin-table-empty"><Search size={28} /><h3>ไม่พบเนื้อหาที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนคำค้น สถานะ หรือ Visibility</p></div>}</div>
    {filtered.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "10px 14px", border: "1px solid #e4e5e9", borderRadius: 10, background: "white" }}>
      <span style={{ fontSize: ".72rem", color: "#747580" }}>Bulk actions:</span>
      <button type="submit" name="bulkAction" value="publish" className="status-action-button"><Globe2 size={13} /> เผยแพร่ที่เลือก</button>
      <button type="submit" name="bulkAction" value="archive" className="status-action-button"><Archive size={13} /> เก็บถาวรที่เลือก</button>
      <button type="submit" name="bulkAction" value="delete" className="danger-button" onClick={(e) => { if (!confirm("ลบรายการที่เลือก?")) e.preventDefault(); }}><Trash2 size={13} /> ลบที่เลือก</button>
    </div>}
    </form>}

  </main>;
}