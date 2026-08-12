import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="not-found-page">
    <div className="not-found-content">
      <span className="not-found-code">404</span>
      <SearchX size={52} strokeWidth={1.5} />
      <h1>ไม่พบหน้าที่กำลังค้นหา</h1>
      <p>ลิงก์อาจถูกย้าย หมดอายุ หรือเนื้อหานี้เป็น Private</p>
      <div className="not-found-actions">
        <Link className="primary-button" href="/knowledge"><Home size={16} /> กลับไปคลังความรู้</Link>
        <Link className="secondary-button" href="/knowledge">ค้นหา</Link>
      </div>
    </div>
  </main>;
}