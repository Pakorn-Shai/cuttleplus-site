import { Check, CircleX, Clock3, Lock, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { AIGenerateForm } from "@/components/admin/ai-generate-form";
import { AIProviderCheck } from "@/components/admin/ai-provider-check";
import { AIStatsDashboard } from "@/components/admin/ai-stats-dashboard";
import { getOpenRouterModel } from "@/core/ai/openrouter";
import { readabilitySuggestionSchema } from "@/core/ai/suggestion";
import { prisma } from "@/lib/prisma";
import { editSuggestionAction, restoreSuggestionAction, reviewSuggestionAction } from "./actions";

const protectedBlockTypes = new Set(["code", "executable-code", "formula-example", "automation-script", "image", "embed"]);

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

function blockType(block: Record<string, unknown> | undefined) {
  if (!block) return "unknown";
  return typeof block.type === "string" ? block.type : "unknown";
}

function isProtected(block: Record<string, unknown> | undefined) {
  return protectedBlockTypes.has(blockType(block));
}

export default async function AIWorkspacePage({ searchParams }: { searchParams: Promise<{ contentId?: string; error?: string; reviewed?: string; restored?: string }> }) {
  const [query, contents, suggestions, jobs] = await Promise.all([
    searchParams,
    prisma.content.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    prisma.aISuggestion.findMany({ where: { status: "PENDING" }, include: { content: { select: { title: true } }, job: true }, orderBy: { createdAt: "desc" } }),
    prisma.aIJob.findMany({ include: { content: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const model = getOpenRouterModel();

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>AI Workspace</h2><p>OpenRouter สร้าง Suggested Version แยกจากต้นฉบับ และเปลี่ยนเนื้อหาได้เมื่อ Owner กด Accept เท่านั้น</p></div><span className="status-badge unlisted">{model}</span></header>
    {query.error === "content_changed" && <div className="admin-alert">บทความถูกแก้หลังสร้าง suggestion กรุณาสร้าง suggestion ใหม่เพื่อป้องกันการเขียนทับข้อมูลล่าสุด</div>}
    {query.reviewed && <div className="admin-success">{query.reviewed === "accept" ? "ยอมรับ suggestion และสร้าง AI revision แล้ว" : "ปฏิเสธ suggestion แล้ว โดยต้นฉบับไม่ถูกเปลี่ยน"}</div>}
    {query.restored && <div className="admin-success">คืนค่า suggestion กลับเป็นต้นฉบับแล้ว</div>}
    <section className="admin-panel ai-create-panel"><div className="panel-head"><h3>ปรับความอ่านง่าย</h3></div><div className="panel-body"><AIProviderCheck /><AIGenerateForm contents={contents} initialContentId={query.contentId} /><p className="ai-provider-note">Provider: OpenRouter · Model: {model} · ระบบไม่ส่ง temperature เพื่อรองรับ reasoning models</p></div></section>
    <section className="ai-review-list">
      <h3>รอตรวจสอบ ({suggestions.length})</h3>
      {suggestions.map((item) => {
        const proposed = readabilitySuggestionSchema.safeParse(item.suggestedJson);
        const original = originalSnapshot(item.originalJson);
        if (!proposed.success || !original) return null;
        const originalBlocks = new Map(original.blocks.map((block) => [String(block.id), block]));
        const changeBlockIds = proposed.data.changes.map((c) => c.blockId);
        return <article className="ai-review-card" key={item.id} id={`suggestion-${item.id}`}>
          <header><div><span className="eyebrow">{item.content.title}</span><h3>{proposed.data.summary}</h3></div><span className="status-badge unlisted">{item.job.model}</span></header>
          <div className="ai-title-diff"><div><small>เดิม</small><strong>{original.title}</strong><p>{original.excerpt}</p></div><div><small>เสนอ</small><strong>{proposed.data.title}</strong><p>{proposed.data.excerpt}</p></div></div>
          <div className="ai-change-list">
            {proposed.data.changes.map((change) => {
              const origBlock = originalBlocks.get(change.blockId);
              const locked = isProtected(origBlock) || change.locked === true;
              const origText = blockText(origBlock);
              const suggText = change.replacementItems?.join(" · ") ?? change.replacementText ?? change.replacementTitle ?? "";
              const hasChange = origText !== suggText && suggText !== "";
              const editId = `edit-${item.id}-${change.blockId}`;
              return <div className={`ai-change-item${locked ? " ai-change-locked" : ""}`} key={`${item.id}-${change.blockId}`}>
                <div className="ai-change-header">
                  {!locked && hasChange && <input type="checkbox" name={`accept-${change.blockId}`} className="ai-block-checkbox" defaultChecked form={`accept-form-${item.id}`} value={change.blockId} />}
                  <small>Block {change.blockId} · {blockType(origBlock)}</small>
                  {locked && <span className="ai-lock-badge"><Lock size={12} /> ล็อก</span>}
                  {!locked && hasChange && (
                    <button type="button" className="ai-edit-toggle" data-edit-target={editId}>
                      <Pencil size={12} /> แก้ไข
                    </button>
                  )}
                </div>
                {hasChange ? (
                  <div className="ai-inline-diff">
                    <div className="ai-diff-orig"><span className="ai-diff-label">เดิม</span><del>{origText}</del></div>
                    <div className="ai-diff-sugg"><span className="ai-diff-label">เสนอ</span><ins>{suggText}</ins></div>
                  </div>
                ) : (
                  <p className="ai-no-change">ไม่มีการเปลี่ยนแปลง</p>
                )}
                {!locked && hasChange && (
                  <div id={editId} className="ai-edit-form" style={{ display: "none" }}>
                    <form action={editSuggestionAction}>
                      <input type="hidden" name="suggestionId" value={item.id} />
                      <input type="hidden" name="blockId" value={change.blockId} />
                      <input type="hidden" name="field" value={change.replacementItems ? "replacementItems" : change.replacementTitle ? "replacementTitle" : "replacementText"} />
                      <textarea name="value" rows={3} defaultValue={change.replacementItems?.join("\n") ?? change.replacementText ?? change.replacementTitle ?? ""} />
                      <button type="submit" className="secondary-button"><Pencil size={12} /> บันทึกการแก้ไข</button>
                    </form>
                  </div>
                )}
                <p className="ai-change-reason">{change.reason}</p>
              </div>;
            })}
          </div>
          <footer>
            <form action={reviewSuggestionAction}>
              <input name="suggestionId" type="hidden" value={item.id} />
              <input name="decision" type="hidden" value="reject" />
              <button className="danger-button"><CircleX size={14} /> Reject ทั้งหมด</button>
            </form>
            <form action={restoreSuggestionAction}>
              <input name="suggestionId" type="hidden" value={item.id} />
              <button className="secondary-button" type="submit"><RotateCcw size={14} /> Restore Original</button>
            </form>
            <form action={reviewSuggestionAction} id={`accept-form-${item.id}`}>
              <input name="suggestionId" type="hidden" value={item.id} />
              <input name="decision" type="hidden" value="accept" />
              <input name="blockIds" type="hidden" value={changeBlockIds.join(",")} />
              <button className="primary-button" type="submit"><Check size={14} /> Accept ทั้งหมด</button>
            </form>
          </footer>
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var form = document.getElementById('accept-form-${item.id}');
              if (!form) return;
              var checkboxes = form.querySelectorAll('.ai-block-checkbox');
              var hiddenInput = form.querySelector('input[name="blockIds"]');
              function updateBlockIds() {
                var selected = [];
                checkboxes.forEach(function(cb) { if (cb.checked) selected.push(cb.value); });
                hiddenInput.value = selected.join(',');
              }
              checkboxes.forEach(function(cb) { cb.addEventListener('change', updateBlockIds); });
              var toggles = document.querySelectorAll('.ai-edit-toggle[data-edit-target]');
              toggles.forEach(function(btn) {
                btn.addEventListener('click', function() {
                  var targetId = btn.getAttribute('data-edit-target');
                  var el = document.getElementById(targetId);
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                });
              });
            })();
          `}} />
        </article>;
      })}
      {!suggestions.length && <div className="empty-state"><Sparkles size={32} /><h3>ไม่มี suggestion รอตรวจ</h3></div>}
    </section>
    <section className="admin-panel ai-job-panel"><div className="panel-head"><h3>งานล่าสุด</h3></div><div className="panel-body">{jobs.map((job) => <div className="ai-job-row" key={job.id}><Clock3 size={14} /><div><strong>{job.content?.title ?? "เนื้อหาถูกลบ"}</strong><span>{job.model} · {job.inputTokens ?? 0}/{job.outputTokens ?? 0} tokens</span>{job.errorMessage && <small className="ai-job-error">{job.errorMessage}</small>}</div><span className={`status-badge ${job.status.toLowerCase()}`}>{job.status.toLowerCase()}</span></div>)}{!jobs.length && <p className="muted">ยังไม่มีประวัติการเรียก AI</p>}</div></section>
    <section className="admin-panel ai-stats-panel"><div className="panel-head"><h3>สถิติการใช้งาน AI</h3></div><div className="panel-body"><AIStatsDashboard /></div></section>
  </main>;
}