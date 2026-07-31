import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "เกี่ยวกับฉัน" };

export default function AboutPage() {
  return <div className="container about-grid"><aside className="about-portrait"><BookOpen size={90} /></aside><section className="about-copy"><p className="eyebrow">About this space</p><h1>เรียนรู้ สร้าง และแบ่งปันอย่างเป็นระบบ</h1><p>Knowledge Hub เริ่มจากความต้องการง่าย ๆ: อยากมีพื้นที่ที่กลับมาอ่านสิ่งที่เคยเรียนรู้แล้วเข้าใจได้ทันที ไม่ว่าจะเป็นสูตร SQL เทคนิควิเคราะห์ข้อมูล หรือบทเรียนจากโปรเจกต์จริง</p><p>เนื้อหาที่นี่เขียนโดยยึดความอ่านง่ายก่อน SEO ใช้ตัวอย่างที่นำไปทดลองได้ และระบุสิ่งที่ยังไม่แน่ใจแทนการเติมคำตอบขึ้นมาเอง</p><h2>หัวข้อที่กำลังศึกษา</h2><div className="skill-cloud">{["Data Analysis", "SQL", "Python", "Power BI", "Artificial Intelligence", "Next.js", "Supply Chain", "Knowledge Management"].map((skill) => <span key={skill}>{skill}</span>)}</div><h2>หลักการของคลังนี้</h2><p>Capture ให้เร็ว · Organize เท่าที่จำเป็น · Understand เมื่อกลับมาอ่าน · Retrieve ให้พบ · Improve อย่างปลอดภัย</p></section></div>;
}
