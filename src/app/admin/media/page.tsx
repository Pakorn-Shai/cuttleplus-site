import { Image as ImageIcon, Trash2 } from "lucide-react";
import { deleteMediaAction } from "./actions";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { prisma } from "@/lib/prisma";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [media, query] = await Promise.all([
    prisma.media.findMany({ include: { _count: { select: { coverFor: true } } }, orderBy: { createdAt: "desc" } }),
    searchParams,
  ]);
  return <main className="admin-content"><header className="admin-page-head"><div><h2>คลังสื่อ</h2><p>อัปโหลดและจัดการรูปภาพผ่าน storage adapter ที่แยกจาก Database</p></div></header>
    {query.error === "in_use" && <div className="admin-alert">ลบรูปนี้ไม่ได้ เพราะยังถูกใช้เป็นภาพปกของเนื้อหา</div>}
    <section className="admin-panel media-uploader"><div className="panel-head"><h3>อัปโหลดรูปใหม่</h3></div><div className="panel-body"><MediaUploadForm /></div></section>
    <section className="media-grid">{media.map((item) => <article className="media-card" key={item.id}><div className="media-preview" role="img" aria-label={item.altText ?? item.fileName} style={item.publicUrl ? { backgroundImage: `url(${item.publicUrl})` } : undefined}>{!item.publicUrl && <ImageIcon size={30} />}</div><div className="media-meta"><strong>{item.fileName}</strong><span>{item.mimeType} · {(item.fileSize / 1024).toFixed(1)} KB</span><p>{item.altText ?? "ไม่มี alt text"}</p><div><span className={`status-badge ${item.visibility.toLowerCase()}`}>{item.visibility.toLowerCase()}</span>{item._count.coverFor > 0 && <span className="status-badge published">ภาพปก {item._count.coverFor}</span>}</div></div><form action={deleteMediaAction}><input name="id" type="hidden" value={item.id} /><button className="danger-button"><Trash2 size={14} /> ลบ</button></form></article>)}</section>
    {!media.length && <div className="empty-state"><ImageIcon size={32} /><h3>ยังไม่มีรูปในคลัง</h3><p>อัปโหลดรูปแรกด้วยแบบฟอร์มด้านบน</p></div>}
  </main>;
}
