import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q ?? "";
  const results = await contentRepository.searchPublic(query);
  return <div className="container"><header className="page-hero"><p className="eyebrow">Search</p><h1>ค้นหาความรู้</h1><p>ค้นจากชื่อ เนื้อหา code หมวดหมู่ และ tag</p><form className="search-page-form"><input name="q" defaultValue={query} autoFocus placeholder="เช่น SQL, Pandas, AI..." /><button className="primary-button">ค้นหา</button></form></header><p className="result-count">{query ? `ผลลัพธ์สำหรับ “${query}” — ${results.length} รายการ` : `เนื้อหาทั้งหมด ${results.length} รายการ`}</p>{results.length ? <div className="content-grid">{results.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div> : <div className="empty-state"><h2>ไม่พบเนื้อหา</h2><p>ลองใช้คำที่สั้นลงหรือค้นด้วยชื่อหมวดหมู่</p></div>}</div>;
}
