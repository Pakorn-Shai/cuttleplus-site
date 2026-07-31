"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="empty-state" style={{ minHeight: "100vh", display: "grid", placeContent: "center", border: 0 }}><AlertTriangle size={44} /><h1>เกิดข้อผิดพลาดในการโหลดหน้า</h1><p>ข้อมูลของคุณยังไม่ถูกเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง</p><button className="primary-button" onClick={reset}>ลองใหม่</button></main>;
}
