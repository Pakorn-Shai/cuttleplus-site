import { Check, CircleX, Clock3, Sparkles } from "lucide-react";
import { reviewSuggestionAction } from "./actions";
import { AIGenerateForm } from "@/components/admin/ai-generate-form";
import { readabilitySuggestionSchema } from "@/core/ai/suggestion";
import { prisma } from "@/lib/prisma";

function originalSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as { title?: unknown; excerpt?: unknown; blocks?: unknown };
  if (typeof record.title !== "string" || typeof record.excerpt !== "string" || !Array.isArray(record.blocks)) return null;
  return { title: record.title, excerpt: record.excerpt, blocks: record.blocks as Record<string, unknown>[] };
}

function blockText(block: Record<string, unknown> | undefined) {
  if (!block) return "ไม่พบบล็อกต้นฉบับ";
  if (typeof block.text === "string") return block.text;
  if (Array.isArray(block.items)) return block.items.filter((item): item is string => typeof item === "string").join(" · ");
  return typeof block.code === "string" ? block.code : "";
}

export default async function AIWorkspacePage({ searchParams }: { searchParams: Promise<{ contentId?: string; error?: string; reviewed?: string }> }) {
  const [query, contents, suggestions, jobs] = await Promise.all([
    searchParams,
    prisma.content.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    prisma.aISuggestion.findMany({ where: { status: "PENDING" }, include: { content: { select: { title: true } }, job: true }, orderBy: { createdAt: "desc" } }),
    prisma.aIJob.findMany({ include: { content: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  return <main className="admin-content"><header className="admin-page-head"><div><h2>AI Workspace</h2><p>OpenRouter สร้าง Suggested Version แยกจากต้นฉบับ และเปลี่ยนเนื้อหาได้เมื่อ Owner กด Accept เท่านั้น</p></div></header>
    {query.error === "content_changed" && <div className="admin-alert">บทความถูกแก้หลังสร้าง suggestion กรุณาสร้าง suggestion ใหม่เพื่อป้องกันการเขียนทับข้อมูลล่าสุด</div>}
    {query.reviewed && <div className="admin-success">{query.reviewed === "accept" ? "ยอมรับ suggestion และสร้าง AI revision แล้ว" : "ปฏิเสธ suggestion แล้ว โดยต้นฉบับไม่ถูกเปลี่ยน"}</div>}
    <section className="admin-panel ai-create-panel"><div className="panel-head"><h3>ปรับความอ่านง่าย</h3></div><div className="panel-body"><AIGenerateForm contents={contents} initialContentId={query.contentId} /></div></section>
    <section className="ai-review-list"><h3>รอตรวจสอบ ({suggestions.length})</h3>{suggestions.map((item) => { const proposed = readabilitySuggestionSchema.safeParse(item.suggestedJson); const original = originalSnapshot(item.originalJson); if (!proposed.success || !original) return null; const originalBlocks = new Map(original.blocks.map((block) => [String(block.id), block])); return <article className="ai-review-card" key={item.id}><header><div><span className="eyebrow">{item.content.title}</span><h3>{proposed.data.summary}</h3></div><span className="status-badge unlisted">{item.job.model}</span></header><div className="ai-title-diff"><div><small>เดิม</small><strong>{original.title}</strong><p>{original.excerpt}</p></div><div><small>เสนอ</small><strong>{proposed.data.title}</strong><p>{proposed.data.excerpt}</p></div></div><div className="ai-change-list">{proposed.data.changes.map((change) => <div key={`${item.id}-${change.blockId}`}><small>Block {change.blockId}</small><del>{blockText(originalBlocks.get(change.blockId))}</del><ins>{change.replacementItems?.join(" · ") ?? change.replacementText ?? change.replacementTitle ?? "คงเดิม"}</ins><p>{change.reason}</p></div>)}</div><footer><form action={reviewSuggestionAction}><input name="suggestionId" type="hidden" value={item.id} /><input name="decision" type="hidden" value="reject" /><button className="danger-button"><CircleX size={14} /> Reject</button></form><form action={reviewSuggestionAction}><input name="suggestionId" type="hidden" value={item.id} /><input name="decision" type="hidden" value="accept" /><button className="primary-button"><Check size={14} /> Accept และสร้าง Revision</button></form></footer></article>; })}{!suggestions.length && <div className="empty-state"><Sparkles size={32} /><h3>ไม่มี suggestion รอตรวจ</h3></div>}</section>
    <section className="admin-panel ai-job-panel"><div className="panel-head"><h3>งานล่าสุด</h3></div><div className="panel-body">{jobs.map((job) => <div className="ai-job-row" key={job.id}><Clock3 size={14} /><div><strong>{job.content?.title ?? "เนื้อหาถูกลบ"}</strong><span>{job.model} · {job.inputTokens ?? 0}/{job.outputTokens ?? 0} tokens</span></div><span className={`status-badge ${job.status.toLowerCase()}`}>{job.status.toLowerCase()}</span></div>)}</div></section>
  </main>;
}
