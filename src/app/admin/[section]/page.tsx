import { Construction } from "lucide-react";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const section = (await params).section;
  return <main className="admin-content"><header className="admin-page-head"><div><h2>{section[0]?.toUpperCase() + section.slice(1)}</h2><p>Module boundary ถูกเตรียมไว้ตาม Repository Plan</p></div></header><div className="empty-state"><Construction size={36} /><h3>พร้อมพัฒนาใน Phase ถัดไป</h3><p>Foundation และ route ถูกแยกไว้แล้ว โดยยังไม่สร้าง workflow ปลอมที่อาจขัดกับ domain จริง</p></div></main>;
}