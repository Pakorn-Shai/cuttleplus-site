import Link from "next/link";
import { Inbox } from "lucide-react";

export default function InboxPage() { return <main className="admin-content"><header className="admin-page-head"><div><h2>Inbox</h2><p>พื้นที่พักข้อมูลก่อนจัดหมวดหมู่และพัฒนาเป็นเนื้อหา</p></div></header><div className="empty-state"><Inbox size={36} /><h3>จัดระเบียบ Inbox เรียบร้อยแล้ว</h3><p>Quick Capture ใหม่จะมาปรากฏตรงนี้</p><Link className="primary-button" href="/admin/content/new">สร้างเนื้อหาใหม่</Link></div></main>; }
