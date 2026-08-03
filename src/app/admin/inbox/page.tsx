import { Archive, FilePenLine, Inbox } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { contentRepository } from "@/core/content/repository";
import { updateContentStatusAction } from "../content/actions";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ result?: string; id?: string }> }) {
  const [contents, query] = await Promise.all([contentRepository.listAll(), searchParams]);
  const inbox = contents.filter((content) => content.status === "inbox");

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Inbox</h2><p>พื้นที่พักข้อมูลก่อนจัดหมวดหมู่และพัฒนาเป็นเนื้อหา</p></div><Link className="primary-button" href="/admin/content/new">สร้างเนื้อหาเต็มรูปแบบ</Link></header>
    {query.result === "captured" && <p className="admin-notice success" role="status">บันทึก Quick Capture เข้า Inbox แล้ว</p>}
    {query.result === "draft" && <p className="admin-notice success" role="status">ย้ายรายการไปเป็น Draft แล้ว</p>}
    {query.result === "archive" && <p className="admin-notice success" role="status">เก็บรายการเข้าคลังแล้ว</p>}
    {inbox.length ? <section className="inbox-list">{inbox.map((content) => <article className="inbox-card" key={content.id}>
      <div className="inbox-card-icon"><Inbox size={18} /></div>
      <div><div className="inbox-card-title"><strong>{content.title}</strong><span className="status-badge private">private</span></div><p>{content.excerpt || "ไม่มีคำอธิบาย"}</p><small>{content.type} · อัปเดต {content.updatedAt}</small></div>
      <div className="inbox-actions"><Link className="secondary-button" href={`/admin/content/${content.id}/edit` as Route}><FilePenLine size={14} /> เปิดจัดระเบียบ</Link><form action={updateContentStatusAction}><input name="contentId" type="hidden" value={content.id} /><input name="action" type="hidden" value="draft" /><input name="returnTo" type="hidden" value="inbox" /><button className="primary-button" type="submit">ย้ายเป็น Draft</button></form><form action={updateContentStatusAction}><input name="contentId" type="hidden" value={content.id} /><input name="action" type="hidden" value="archive" /><input name="returnTo" type="hidden" value="inbox" /><button className="icon-button" type="submit" title="เก็บถาวร" aria-label="เก็บถาวร"><Archive size={14} /></button></form></div>
    </article>)}</section> : <div className="empty-state"><Inbox size={36} /><h3>จัดระเบียบ Inbox เรียบร้อยแล้ว</h3><p>Quick Capture ใหม่จะมาปรากฏตรงนี้</p><Link className="secondary-button" href="/admin">กลับไป Quick Capture</Link></div>}
  </main>;
}
