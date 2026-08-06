import Link from "next/link";
import { Archive, CalendarClock, Globe2, Pencil, Search, X } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import { clearContentScheduleAction, setContentScheduleAction, updateContentStatusAction } from "./actions";

const resultMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  publish: { tone: "success", text: "เผยแพร่บทความแล้ว และตั้ง Visibility เป็น Public ให้อัตโนมัติหากเดิมเป็น Private" },
  draft: { tone: "success", text: "เปลี่ยนบทความกลับเป็น Draft แล้ว" },
  archive: { tone: "success", text: "เก็บบทความเข้าคลังแล้ว" },
  restore: { tone: "success", text: "กู้บทความจากคลังกลับมาเป็น Draft แล้ว" },
  scheduled: { tone: "success", text: "ตั้งเวลาเผยแพร่เรียบร้อย ระบบจะเผยแพร่ให้อัตโนมัติเมื่อถึงกำหนด" },
  unscheduled: { tone: "success", text: "ยกเลิกการตั้งเวลาเผยแพร่ และกลับเป็น Draft แล้ว" },
  incomplete: { tone: "error", text: "ยังเผยแพร่/ตั้งเวลาไม่ได้: บทความต้องมีชื่อ slug และเนื้อหาอย่างน้อยหนึ่งย่อหน้า" },
  not_found: { tone: "error", text: "ไม่พบบทความที่ต้องการเปลี่ยนสถานะ" },
  invalid: { tone: "error", text: "คำขอเปลี่ยนสถานะไม่ถูกต้อง" },
};

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ result?: string; q?: string; status?: string; visibility?: string }> }) {
  const [contents, query] = await Promise.all([contentRepository.listAll(), searchParams]);
  const message = query.result ? resultMessages[query.result] : undefined;
  const search = query.q?.trim().toLocaleLowerCase("th") ?? "";
  const allowedStatuses = new Set(["inbox", "draft", "scheduled", "published", "archived"]);
  const allowedVisibilities = new Set(["private", "unlisted", "public"]);
  const status = query.status && allowedStatuses.has(query.status) ? query.status : "";
  const visibility = query.visibility && allowedVisibilities.has(query.visibility) ? query.visibility : "";
  const filtered = contents.filter((content) => {
    if (status && content.status !== status) return false;
    if (visibility && content.visibility !== visibility) return false;
    if (!search) return true;
    return [content.title, content.slug, content.excerpt, content.category.name, ...content.tags, JSON.stringify(content.blocks)].join(" ").toLocaleLowerCase("th").includes(search);
  });

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>เนื้อหาทั้งหมด</h2><p>ค้นหา กรอง และจัดการวงจรชีวิตของความรู้</p></div><Link className="primary-button" href="/admin/content/new">+ สร้างบทความ</Link></header>
    {message && <p className={`admin-notice ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    <form className="admin-filters" method="get"><label className="search-box"><span className="sr-only">ค้นหาเนื้อหา</span><Search size={15} /><input className="admin-search" name="q" defaultValue={query.q} placeholder="ค้นหาชื่อ เนื้อหา หรือ tag..." /></label><select className="filter-select" name="status" defaultValue={status}><option value="">ทุกสถานะ</option><option value="inbox">Inbox</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select><select className="filter-select" name="visibility" defaultValue={visibility}><option value="">ทุก Visibility</option><option value="public">Public</option><option value="private">Private</option><option value="unlisted">Unlisted</option></select><button className="secondary-button" type="submit">กรอง</button>{(search || status || visibility) && <Link className="text-link" href="/admin/content">ล้าง</Link>}</form>
    <p className="admin-result-count">แสดง {filtered.length} จาก {contents.length} รายการ</p>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th>Visibility</th><th>หมวดหมู่</th><th>อัปเดต</th><th>จัดการ</th></tr></thead><tbody>{filtered.map((content) => {
      const isScheduled = content.status === "scheduled";
      const canSchedule = content.status === "draft" || content.status === "inbox";
      const lifecycleAction = content.status === "archived" ? "restore" : content.status === "published" ? "draft" : "publish";
      const lifecycleLabel = content.status === "archived" ? "กู้เป็น Draft" : content.status === "published" ? "กลับเป็น Draft" : "เผยแพร่";
      return <tr key={content.id}>
      <td className="admin-table-title"><Link href={`/admin/content/${content.id}/edit`}><strong>{content.title}</strong><span>/{content.slug}</span></Link></td>
      <td>{content.type}</td><td><span className={`status-badge ${content.status}`}>{content.status}</span>{isScheduled && content.scheduledAt && <span className="schedule-when"><CalendarClock size={12} /> {formatScheduled(content.scheduledAt)}</span>}</td><td><span className={`status-badge ${content.visibility}`}>{content.visibility}</span></td><td>{content.category.name}</td><td>{content.updatedAt}</td>
      <td><div className="table-actions"><Link className="icon-button" href={`/admin/content/${content.id}/edit`} aria-label="แก้ไข" title="แก้ไข"><Pencil size={14} /></Link>{isScheduled ? <form action={clearContentScheduleAction}><input type="hidden" name="contentId" value={content.id} /><button className="status-action-button" type="submit"><X size={14} /> ยกเลิกการตั้งเวลา</button></form> : <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value={lifecycleAction} /><button className="status-action-button" type="submit"><Globe2 size={14} /> {lifecycleLabel}</button></form>}{canSchedule && <form className="schedule-form" action={setContentScheduleAction}><input type="hidden" name="contentId" value={content.id} /><input type="datetime-local" name="scheduledAt" required aria-label="เวลาที่ต้องการเผยแพร่" /><button className="status-action-button" type="submit"><CalendarClock size={14} /> ตั้งเวลา</button></form>}{content.status !== "archived" && <form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value="archive" /><button className="icon-button" type="submit" aria-label="เก็บถาวร" title="เก็บถาวร"><Archive size={14} /></button></form>}</div></td>
    </tr>; })}</tbody></table>{!filtered.length && <div className="empty-state admin-table-empty"><Search size={28} /><h3>ไม่พบเนื้อหาที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนคำค้น สถานะ หรือ Visibility</p></div>}</div>
  </main>;
}