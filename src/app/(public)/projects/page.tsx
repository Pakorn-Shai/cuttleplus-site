import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeCard } from "@/components/public/knowledge-card";
import { contentRepository } from "@/core/content/repository";
import { getSiteSettings } from "@/core/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Projects — ${settings.siteName}`,
    description: "โปรเจกต์และผลงานทั้งหมด",
    alternates: { canonical: "/projects" },
  };
}

export default async function ProjectsPage() {
  const contents = (await contentRepository.listPublic()).filter(
    (c) => c.type === "Project Note",
  );
  const settings = await getSiteSettings();

  return <div className="container">
    <header className="page-hero">
      <p className="eyebrow">Projects</p>
      <h1>โปรเจกต์</h1>
      <p>โปรเจกต์และผลงานทั้งหมดที่เผยแพร่บน {settings.siteName}</p>
    </header>
    {contents.length ? <div className="content-grid">{contents.map((content) => <KnowledgeCard content={content} key={content.id} />)}</div> : <div className="empty-state"><h2>ยังไม่มีโปรเจกต์</h2><p>{`เนื้อหาที่มีประเภท "Project Note" จะปรากฏที่นี่`}</p><Link href="/knowledge" className="text-link">← กลับไปคลังความรู้</Link></div>}
  </div>;
}