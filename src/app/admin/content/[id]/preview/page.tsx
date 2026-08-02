import { ArrowLeft, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleReader } from "@/components/public/article-reader";
import { contentRepository } from "@/core/content/repository";

export default async function AdminContentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const content = await contentRepository.findById((await params).id);
  if (!content) notFound();

  return <main className="admin-content admin-preview">
    <header className="admin-page-head">
      <div>
        <Link className="text-link" href={`/admin/content/${content.id}/edit` as Route}><ArrowLeft size={14} /> กลับไปแก้ไข</Link>
        <h2>Preview: {content.title}</h2>
        <p>แสดงตัวอย่างได้ทุกสถานะ · {content.status} / {content.visibility}</p>
      </div>
      <Link className="primary-button" href={`/admin/content/${content.id}/edit` as Route}><Pencil size={14} /> แก้ไขบทความ</Link>
    </header>
    <article className="admin-preview-paper">
      <header className="article-header">
        <span className="pill">{content.type}</span>
        <h1>{content.title}</h1>
        <p className="article-excerpt">{content.excerpt}</p>
        <div className="tag-row">{content.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      </header>
      <ArticleReader blocks={content.blocks} />
    </article>
  </main>;
}
