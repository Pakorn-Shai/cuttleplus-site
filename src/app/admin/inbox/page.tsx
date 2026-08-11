import { Archive, FilePenLine, Inbox } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { contentRepository } from "@/core/content/repository";
import { bulkInboxAction, updateContentStatusAction } from "../content/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
const onClickBulkDraft = "inboxBulkSubmit('draft')" as any;
const onClickBulkArchive = "inboxBulkSubmit('archive')" as any;
const onChangeBulk = "updateInboxBulk()" as any;

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ result?: string; id?: string }> }) {
  const [contents, query] = await Promise.all([contentRepository.listAll(), searchParams]);
  const inbox = contents.filter((content) => content.status === "inbox");

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Inbox</h2><p>พื้นที่พักข้อมูลก่อนจัดหมวดหมู่และพัฒนาเป็นเนื้อหา</p></div><Link className="primary-button" href="/admin/content/new">สร้างเนื้อหาเต็มรูปแบบ</Link></header>
    {query.result === "captured" && <p className="admin-notice success" role="status">บันทึก Quick Capture เข้า Inbox แล้ว</p>}
    {query.result === "draft" && <p className="admin-notice success" role="status">ย้ายรายการไปเป็น Draft แล้ว</p>}
    {query.result === "archive" && <p className="admin-notice success" role="status">เก็บรายการเข้าคลังแล้ว</p>}
    {query.result === "bulk_draft" && <p className="admin-notice success" role="status">ย้ายรายการที่เลือกไปเป็น Draft แล้ว</p>}
    {query.result === "bulk_archive" && <p className="admin-notice success" role="status">เก็บรายการที่เลือกเข้าคลังแล้ว</p>}
    {inbox.length ? <>
      <form id="bulk-inbox-form" action={bulkInboxAction}>
        <input type="hidden" name="ids" value="" />
        <input type="hidden" name="action" value="" />
      </form>
      <div className="inbox-bulk-bar" id="inbox-bulk-bar" style={{ display: "none" }}>
        <span className="inbox-bulk-count">0 รายการที่เลือก</span>
        <button className="secondary-button" type="button" onClick={onClickBulkDraft}>ย้ายเป็น Draft</button>
        <button className="icon-button" type="button" onClick={onClickBulkArchive} title="เก็บถาวร"><Archive size={14} /></button>
      </div>
      <section className="inbox-list">{inbox.map((content) => <article className="inbox-card" key={content.id}>
        <div className="inbox-card-icon"><input type="checkbox" className="inbox-checkbox" value={content.id} aria-label={`เลือก ${content.title}`} onChange={onChangeBulk} /></div>
        <div><div className="inbox-card-title"><strong>{content.title}</strong><span className="status-badge private">private</span></div><p>{content.excerpt || "ไม่มีคำอธิบาย"}</p><small>{content.type} · อัปเดต {content.updatedAt}</small></div>
        <div className="inbox-actions"><Link className="secondary-button" href={`/admin/content/${content.id}/edit` as Route}><FilePenLine size={14} /> เปิดจัดระเบียบ</Link><form action={updateContentStatusAction}><input name="contentId" type="hidden" value={content.id} /><input name="action" type="hidden" value="draft" /><input name="returnTo" type="hidden" value="inbox" /><button className="primary-button" type="submit">ย้ายเป็น Draft</button></form><form action={updateContentStatusAction}><input name="contentId" type="hidden" value={content.id} /><input name="action" type="hidden" value="archive" /><input name="returnTo" type="hidden" value="inbox" /><button className="icon-button" type="submit" title="เก็บถาวร" aria-label="เก็บถาวร"><Archive size={14} /></button></form></div>
      </article>)}</section>
    </> : <div className="empty-state"><Inbox size={36} /><h3>จัดระเบียบ Inbox เรียบร้อยแล้ว</h3><p>Quick Capture ใหม่จะมาปรากฏตรงนี้</p><Link className="secondary-button" href="/admin">กลับไป Quick Capture</Link></div>}
    <script dangerouslySetInnerHTML={{ __html: `
      function updateInboxBulk() {
        var checks = document.querySelectorAll('.inbox-checkbox:checked');
        var bar = document.getElementById('inbox-bulk-bar');
        var countEl = bar.querySelector('.inbox-bulk-count');
        if (checks.length > 0) { bar.style.display = 'flex'; countEl.textContent = checks.length + ' รายการที่เลือก'; } else { bar.style.display = 'none'; }
      }
      function inboxBulkSubmit(action) {
        var checks = document.querySelectorAll('.inbox-checkbox:checked');
        var ids = Array.from(checks).map(function(c) { return c.value; }).join(',');
        var form = document.getElementById('bulk-inbox-form');
        form.querySelector('input[name="ids"]').value = ids;
        form.querySelector('input[name="action"]').value = action;
        form.requestSubmit();
      }
    ` }} />
  </main>;
}