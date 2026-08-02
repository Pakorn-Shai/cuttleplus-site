import { ArrowLeft, History, RotateCcw } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { restoreRevisionAction } from "./actions";
import { listContentRevisions } from "@/core/content/editor-service";
import { prisma } from "@/lib/prisma";

export default async function RevisionHistoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ restored?: string }> }) {
  const { id } = await params;
  const [content, revisions, query] = await Promise.all([
    prisma.content.findUnique({ where: { id }, select: { id: true, title: true } }),
    listContentRevisions(id),
    searchParams,
  ]);
  if (!content) notFound();
  return <main className="admin-content"><header className="admin-page-head"><div><Link className="text-link" href={`/admin/content/${id}/edit`}><ArrowLeft size={14} /> กลับไป Editor</Link><h2>Revision History</h2><p>{content.title} · ระบบจะสำรองเวอร์ชันปัจจุบันก่อน restore เสมอ</p></div></header>
    {query.restored === "1" && <div className="admin-success">ย้อนกลับไปยัง revision ที่เลือกแล้ว</div>}
    <section className="revision-list">{revisions.map((revision, index) => <article className="revision-card" key={revision.id}><div className="revision-marker"><History size={15} /></div><div><div className="revision-title"><strong>Revision {revision.revisionNumber}</strong><span className={`status-badge ${revision.source.toLowerCase()}`}>{revision.source.toLowerCase()}</span>{index === 0 && <span className="status-badge published">ล่าสุด</span>}</div><h3>{revision.title}</h3><p>{revision.plainText.slice(0, 220) || "ไม่มีข้อความ"}{revision.plainText.length > 220 ? "…" : ""}</p><small>{revision.reason ?? "Manual revision"} · {revision.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</small></div><form action={restoreRevisionAction}><input name="contentId" type="hidden" value={content.id} /><input name="revisionId" type="hidden" value={revision.id} /><button className="secondary-button"><RotateCcw size={14} /> Restore</button></form></article>)}</section>
    {!revisions.length && <div className="empty-state"><History size={32} /><h3>ยังไม่มี Revision</h3><p>กดบันทึกฉบับร่างใน Editor เพื่อสร้าง revision แรก</p></div>}
  </main>;
}
