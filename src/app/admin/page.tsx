import Link from "next/link";
import { BookOpenCheck, FileClock, FileText, Globe2, Inbox, LockKeyhole, Sparkles } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import { prisma } from "@/lib/prisma";
import { quickCaptureAction } from "./actions";

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ capture?: string }> }) {
  const [contents, pendingSuggestions, uncategorized, untagged, unusedMedia, query] = await Promise.all([
    contentRepository.listAll(),
    prisma.aISuggestion.count({ where: { status: "PENDING" } }),
    prisma.content.count({ where: { categoryId: null, deletedAt: null, status: { not: "DELETED" } } }),
    prisma.content.count({ where: { tags: { none: {} }, deletedAt: null, status: { not: "DELETED" } } }),
    prisma.media.count({ where: { coverFor: { none: {} } } }),
    searchParams,
  ]);
  const publicCount = contents.filter((item) => item.visibility === "public" && item.status === "published").length;
  const privateCount = contents.filter((item) => item.visibility === "private").length;
  const draftCount = contents.filter((item) => item.status === "draft").length;
  const inboxCount = contents.filter((item) => item.status === "inbox").length;
  const missingExcerpt = contents.filter((item) => !item.excerpt && item.status === "published").length;

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>สวัสดี, Knowledge Owner 👋</h2><p>ภาพรวมคลังความรู้และงานที่รอการจัดระเบียบ</p></div><Link className="secondary-button" href="/knowledge">ดูหน้าบ้าน</Link></header>
    {query.capture === "invalid" && <p className="admin-notice error" role="alert">กรอกข้อความ Quick Capture และตรวจ URL ให้ถูกต้อง</p>}
    {query.capture === "rate_limited" && <p className="admin-notice error" role="alert">บันทึกถี่เกินไป กรุณารอสักครู่แล้วลองใหม่</p>}
    <section className="stat-grid">
      <article className="stat-card"><div className="stat-card-top"><span>เนื้อหาทั้งหมด</span><FileText size={17} /></div><strong>{contents.length}</strong><small>ทุกสถานะและ visibility</small></article>
      <article className="stat-card"><div className="stat-card-top"><span>เผยแพร่แล้ว</span><Globe2 size={17} /></div><strong>{publicCount}</strong><small>Public และค้นพบได้บนหน้าบ้าน</small></article>
      <article className="stat-card"><div className="stat-card-top"><span>ฉบับร่าง / Inbox</span><FileClock size={17} /></div><strong>{draftCount} / {inboxCount}</strong><small>รอเขียนหรือจัดระเบียบต่อ</small></article>
      <article className="stat-card"><div className="stat-card-top"><span>ส่วนตัว</span><LockKeyhole size={17} /></div><strong>{privateCount}</strong><small>ไม่ถูกส่งสู่ public index</small></article>
    </section>
    <section className="admin-grid">
      <article className="admin-panel"><div className="panel-head"><h3>แก้ไขล่าสุด</h3><Link className="text-link" href="/admin/content">ดูทั้งหมด</Link></div><div className="panel-body">{contents.slice(0, 4).map((content, index) => <Link className="activity-item" href={`/admin/content/${content.id}/edit`} key={content.id}><span className="activity-icon">{index === 0 ? <BookOpenCheck size={16} /> : <FileText size={16} />}</span><div><strong>{content.title}</strong><span>{content.category.name} · {content.status}</span></div><span>{content.updatedAt}</span></Link>)}</div></article>
      <article className="admin-panel quick-capture"><div className="panel-head"><h3>Quick Capture</h3><Inbox size={16} /></div><form action={quickCaptureAction} className="panel-body quick-capture-form"><input name="title" maxLength={240} placeholder="ชื่อชั่วคราว (ไม่บังคับ)" /><div className="quick-capture-row"><select name="contentType" defaultValue="note"><option value="note">บันทึก</option><option value="code">Code</option><option value="link">Link</option></select><input name="sourceUrl" type="url" placeholder="Source URL (ไม่บังคับ)" /></div><textarea name="text" required maxLength={20000} placeholder="วางไอเดีย ลิงก์ หรือ code สั้น ๆ ที่นี่..." aria-label="Quick capture" /><div className="quick-row"><span className="muted">บันทึกเข้า Inbox แบบ Private</span><button className="primary-button" type="submit">บันทึก</button></div></form></article>
    </section>
    <section className="admin-grid"><article className="admin-panel"><div className="panel-head"><h3>สิ่งที่ควรตรวจ</h3></div><div className="panel-body">
      <Link className="activity-item" href="/admin/ai"><span className="activity-icon"><Sparkles size={16} /></span><div><strong>{pendingSuggestions} AI suggestions รอการตรวจ</strong><span>AI จะไม่เขียนทับต้นฉบับโดยตรง</span></div><span>เปิด →</span></Link>
      <Link className="activity-item" href="/admin/content"><span className="activity-icon"><Inbox size={16} /></span><div><strong>{uncategorized} เนื้อหายังไม่มี Category</strong><span>จัดระเบียบเพื่อให้ค้นหาได้ง่ายขึ้น</span></div><span>เปิด →</span></Link>
      {untagged > 0 && <Link className="activity-item" href="/admin/content"><span className="activity-icon"><Inbox size={16} /></span><div><strong>{untagged} เนื้อหายังไม่มี Tag</strong><span>เพิ่ม Tag เพื่อให้ค้นพบได้มากขึ้น</span></div><span>เปิด →</span></Link>}
      {missingExcerpt > 0 && <Link className="activity-item" href="/admin/content?status=published"><span className="activity-icon"><Inbox size={16} /></span><div><strong>{missingExcerpt} บทความที่เผยแพร่แล้วไม่มี excerpt</strong><span>เพิ่มคำอธิบายเพื่อ SEO และ Library</span></div><span>เปิด →</span></Link>}
      {unusedMedia > 0 && <Link className="activity-item" href="/admin/media"><span className="activity-icon"><Inbox size={16} /></span><div><strong>{unusedMedia} สื่อที่ไม่ได้ถูกใช้งาน</strong><span>รูปที่ไม่ได้เป็นภาพปกของเนื้อหาใด</span></div><span>เปิด →</span></Link>}
    </div></article></section>
  </main>;
}