import { Image as ImageIcon, Search, Trash2 } from "lucide-react";
import { deleteMediaAction } from "./actions";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { prisma } from "@/lib/prisma";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ error?: string; q?: string; type?: string }> }) {
  const [media, query] = await Promise.all([
    prisma.media.findMany({ include: { _count: { select: { coverFor: true } } }, orderBy: { createdAt: "desc" } }),
    searchParams,
  ]);

  const q = query.q?.trim().toLowerCase() ?? "";
  const typeFilter = query.type ?? "";
  const filtered = media.filter((item) => {
    if (typeFilter && !item.mimeType.startsWith(typeFilter)) return false;
    if (q) {
      const searchable = [item.fileName, item.altText, item.caption, item.credit, item.sourceUrl].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  return <main className="admin-content"><header className="admin-page-head"><div><h2>คลังสื่อ</h2><p>อัปโหลดและจัดการรูปภาพผ่าน storage adapter ที่แยกจาก Database</p></div></header>
    {query.error === "in_use" && <div className="admin-alert">ลบรูปนี้ไม่ได้ เพราะยังถูกใช้เป็นภาพปกของเนื้อหา</div>}
    <section className="admin-panel media-uploader"><div className="panel-head"><h3>อัปโหลดรูปใหม่</h3></div><div className="panel-body"><MediaUploadForm /></div></section>

    <form className="admin-filters" method="get">
      <label className="search-box"><span className="sr-only">ค้นหาสื่อ</span><Search size={15} /><input className="admin-search" name="q" defaultValue={query.q} placeholder="ค้นหาชื่อไฟล์, alt text, caption..." /></label>
      <select className="filter-select" name="type" defaultValue={typeFilter}>
        <option value="">ทุกประเภท</option>
        <option value="image/">Images</option>
        <option value="video/">Videos</option>
        <option value="application/pdf">PDF</option>
      </select>
      <button className="secondary-button" type="submit">กรอง</button>
      {(q || typeFilter) && <a className="text-link" href="/admin/media">ล้าง</a>}
    </form>
    <p className="admin-result-count">แสดง {filtered.length} จาก {media.length} รายการ</p>

    <section className="media-grid">{filtered.map((item) => {
      const sizeKB = item.fileSize / 1024;
      const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(1)} KB`;
      const dimensionDisplay = item.width && item.height ? `${item.width}×${item.height}px` : null;
      return <article className="media-card" key={item.id}>
        <div className="media-preview" role="img" aria-label={item.altText ?? item.fileName} style={item.publicUrl ? { backgroundImage: `url(${item.publicUrl})` } : undefined}>{!item.publicUrl && <ImageIcon size={30} />}</div>
        <div className="media-meta">
          <strong>{item.fileName}</strong>
          <span>{item.mimeType} · {sizeDisplay}{dimensionDisplay && ` · ${dimensionDisplay}`}</span>
          <p>{item.altText ?? "ไม่มี alt text"}</p>
          <div>
            <span className={`status-badge ${item.visibility.toLowerCase()}`}>{item.visibility.toLowerCase()}</span>
            {item._count.coverFor > 0 && <span className="status-badge published">ภาพปก {item._count.coverFor}</span>}
          </div>
        </div>
        <form action={deleteMediaAction}><input name="id" type="hidden" value={item.id} /><button className="danger-button"><Trash2 size={14} /> ลบ</button></form>
      </article>;
    })}</section>
    {!filtered.length && <div className="empty-state"><ImageIcon size={32} /><h3>ไม่พบสื่อที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนคำค้นหรือประเภท</p></div>}
  </main>;
}