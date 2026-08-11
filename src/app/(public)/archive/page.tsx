import type { Metadata } from "next";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";
import { getSiteSettings } from "@/core/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Archive — ${settings.siteName}`,
    description: "บทความและบันทึกทั้งหมดเรียงตามวันที่อัปเดต",
    alternates: { canonical: "/archive" },
  };
}

export default async function ArchivePage() {
  const contents = await contentRepository.listPublic();
  const settings = await getSiteSettings();

  // Group by year-month
  const grouped = new Map<string, typeof contents>();
  for (const content of contents) {
    const key = content.updatedAt.slice(0, 7); // YYYY-MM
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(content);
  }

  return <div className="container">
    <header className="page-hero">
      <p className="eyebrow">Archive</p>
      <h1>คลังบทความ</h1>
      <p>บทความและบันทึกทั้งหมด {contents.length} รายการ เรียงตามวันที่อัปเดต</p>
    </header>
    {contents.length ? Array.from(grouped.entries()).map(([month, items]) => {
      const [year, m] = month.split("-");
      const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const label = `${monthNames[parseInt(m, 10) - 1]} ${parseInt(year, 10) + 543}`;
      return <section className="archive-group" key={month}>
        <h2 className="archive-month">{label} <span className="archive-count">{items.length} บทความ</span></h2>
        <div className="content-grid">{items.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div>
      </section>;
    }) : <div className="empty-state"><h2>ยังไม่มีบทความ</h2><p>เนื้อหา Public จะปรากฏที่นี่หลังเผยแพร่</p></div>}
  </div>;
}