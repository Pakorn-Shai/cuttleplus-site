import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="empty-state" style={{ minHeight: "100vh", display: "grid", placeContent: "center", border: 0 }}><SearchX size={48} /><h1>ไม่พบหน้าที่กำลังค้นหา</h1><p>ลิงก์อาจถูกย้าย หรือเนื้อหานี้เป็น Private</p><Link className="primary-button" href="/knowledge">กลับไปคลังความรู้</Link></main>;
}