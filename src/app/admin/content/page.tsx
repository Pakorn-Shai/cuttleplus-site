import Link from "next/link";
import { Archive, Globe2, Pencil, Search } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import { updateContentStatusAction } from "./actions";

const resultMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  publish: { tone: "success", text: "เผยแพร่บทความแล้ว และตั้ง Visibility เป็น Public ให้อัตโนมัติหากเดิมเป็น Private" },
  draft: { tone: "success", text: "เปลี่ยนบทความกลับเป็น Draft แล้ว" },
  archive: { tone: "success", text: "เก็บบทความเข้าคลังแล้ว" },
  incomplete: { tone: "error", text: "ยังเผยแพร่ไม่ได้: บทความต้องมีชื่อ slug และเนื้อหาอย่างน้อยหนึ่งย่อหน้า" },
  not_found: { tone: "error", text: "ไม่พบบทความที่ต้องการเปลี่ยนสถานะ" },
  invalid: { tone: "error", text: "คำขอเปลี่ยนสถานะไม่ถูกต้อง" },
};

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [contents, query] = await Promise.all([contentRepository.listAll(), searchParams]);
  const message = query.result ? resultMessages[query.result] : undefined;

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>เนื้อหาทั้งหมด</h2><p>ค้นหา กรอง และจัดการวงจรชีวิตของความรู้</p></div><Link className="primary-button" href="/admin/content/new">+ สร้างเนื้อหา</Link></header>
    {message && <p className={`admin-notice ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    <div className="admin-filters"><label className="search-box"><span className="sr-only">ค้นหาเนื้อหา</span><Search size={15} /><input className="admin-search" placeholder="ค้นหาชื่อหรือ tag..." /></label><select className="filter-select"><option>ทุกสถานะ</option><option>Draft</option><option>Published</option></select><select className="filter-select"><option>ทุก Visibility</option><option>Public</option><option>Private</option><option>Unlisted</option></select></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th>Visibility</th><th>หมวดหมู่</th><th>อัปเดต</th><th>จัดการ</th></tr></thead><tbody>{contents.map((content) => <tr key={content.id}>
      <td className="admin-table-title"><Link href={`/admin/content/${content.id}/edit`}><strong>{content.title}</strong><span>/{content.slug}</span></Link></td>
      <td>{content.type}</td><td><span className={`status-badge ${content.status}`}>{content.status}</span></td><td><span className={`status-badge ${content.visibility}`}>{content.visibility}</span></td><td>{content.category.name}</td><td>{content.updatedAt}</td>
      <td><div className="table-actions"><Link className="icon-button" href={`/admin/content/${content.id}/edit`} aria-label="แก้ไข" title="แก้ไข"><Pencil size={14} /></Link><form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value={content.status === "published" ? "draft" : "publish"} /><button className="status-action-button" type="submit"><Globe2 size={14} /> {content.status === "published" ? "กลับเป็น Draft" : "เผยแพร่"}</button></form><form action={updateContentStatusAction}><input type="hidden" name="contentId" value={content.id} /><input type="hidden" name="action" value="archive" /><button className="icon-button" type="submit" aria-label="เก็บถาวร" title="เก็บถาวร"><Archive size={14} /></button></form></div></td>
    </tr>)}</tbody></table></div>
  </main>;
}
