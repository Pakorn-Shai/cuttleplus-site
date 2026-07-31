import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { CSSProperties } from "react";
import type { KnowledgeContent } from "@/core/content/types";

export function KnowledgeCard({ content }: { content: KnowledgeContent }) {
  return (
    <Link className="knowledge-card" href={`/knowledge/${content.slug}`}>
      <div className="card-top">
        <span className="category-label" style={{ "--category": content.category.color } as CSSProperties}><span className="category-dot" />{content.category.name}</span>
        <ArrowUpRight size={16} className="muted" />
      </div>
      <h3>{content.title}</h3>
      <p>{content.excerpt}</p>
      <div className="tag-row">{content.tags.slice(0, 2).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <div className="card-meta"><span>{content.type}</span><span><Clock size={12} /> {content.readingTime} นาที</span></div>
    </Link>
  );
}
