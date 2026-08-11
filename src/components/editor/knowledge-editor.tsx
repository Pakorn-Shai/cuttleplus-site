"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema, type PartialBlock } from "@blocknote/core";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { BlockNoteView } from "@blocknote/mantine";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { AlertTriangle, ArrowLeft, Braces, Check, ChevronDown, Database, Download, Eye, History, Image, Link2, Quote, Sparkles, Workflow } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EditorContentType, EditorDraft, EditorTaxonomyOptions, LearningBlock } from "@/core/content/editor-service";
import { learningBlockToEditorBlock, learningBlocksFromEditorBlocks } from "@/core/content/document";
import { createLearningBlock } from "@/core/content/learning-blocks";
import { ExecutableCodeAuthoring } from "./executable-code-authoring";
import { knowledgeEditorBlockSpecs } from "./learning-block-specs";
import { LearningBlockAuthoring } from "./learning-block-authoring";

const editorSchema = BlockNoteSchema.create({ blockSpecs: knowledgeEditorBlockSpecs });

const contentTypeLabels: Record<EditorContentType, string> = {
  QUICK_NOTE: "Quick Note",
  KNOWLEDGE_NOTE: "Knowledge Note",
  TUTORIAL: "Tutorial",
  ARTICLE: "Article",
  CODE_SNIPPET: "Code Snippet",
  TROUBLESHOOTING: "Troubleshooting",
  CHEAT_SHEET: "Cheat Sheet",
  REFERENCE: "Reference",
  LEARNING_LOG: "Learning Log",
  PROJECT_NOTE: "Project Note",
  CASE_STUDY: "Case Study",
  CHECKLIST: "Checklist",
};

const initialContent = [
  { type: "paragraph" as const, content: "เริ่มเขียนสิ่งที่เรียนรู้ได้เลย หรือพิมพ์ / เพื่อเลือก Block" },
  { type: "heading" as const, props: { level: 2 as const }, content: "หัวข้อสำคัญ" },
  { type: "bulletListItem" as const, content: "เพิ่มบริบทและตัวอย่างที่นำไปใช้ได้" },
  { type: "codeBlock" as const, props: { language: "typescript" }, content: "const knowledge = { readable: true, searchable: true };" },
];

export function KnowledgeEditor({ initialDraft, taxonomy }: { initialDraft?: EditorDraft; taxonomy: EditorTaxonomyOptions }) {
  const router = useRouter();
  const editor = useCreateBlockNote({ schema: editorSchema, initialContent: ((initialDraft?.editorBlocks as PartialBlock[]) ?? initialContent) as never });
  const [status, setStatus] = useState<"unsaved" | "saved" | "saving" | "error">(initialDraft ? "saved" : "unsaved");
  const [errorMessage, setErrorMessage] = useState("");
  const [contentId, setContentId] = useState(initialDraft?.id);
  const [title, setTitle] = useState(initialDraft?.title ?? "บทความใหม่ที่กำลังเรียนรู้");
  const [slug, setSlug] = useState(initialDraft?.slug ?? "บทความใหม่ที่กำลังเรียนรู้");
  const [excerpt, setExcerpt] = useState(initialDraft?.excerpt ?? "");
  const [categorySlug, setCategorySlug] = useState(initialDraft?.categorySlug ?? "");
  const [tags, setTags] = useState(initialDraft?.tags.join(", ") ?? "");
  const [visibility, setVisibility] = useState<EditorDraft["visibility"]>(initialDraft?.visibility ?? "private");
  const [contentType, setContentType] = useState<EditorContentType>(initialDraft?.contentType ?? "KNOWLEDGE_NOTE");
  const [learningBlocks, setLearningBlocks] = useState<LearningBlock[]>(initialDraft?.learningBlocks ?? []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const stateRef = useRef({ contentId, title, slug, excerpt, categorySlug, tags, visibility, contentType, learningBlocks });
  stateRef.current = { contentId, title, slug, excerpt, categorySlug, tags, visibility, contentType, learningBlocks };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function scheduleSave() {
    if (!stateRef.current.contentId) {
      setStatus("unsaved");
      return;
    }
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persistDraft(false), 800);
  }

  function applyLearningBlocks(next: LearningBlock[]) {
    const nextById = new Map(next.map((block) => [block.id, block]));
    const nativeBlocks = editor.document.filter((block) => block.type === "executableCode" || block.type === "formulaExample" || block.type === "automationScript");
    const existingIds = new Set<string>();
    for (const nativeBlock of nativeBlocks) {
      const parsed = learningBlocksFromEditorBlocks([nativeBlock]);
      const current = parsed[0];
      const replacement = current ? nextById.get(current.id) : undefined;
      if (replacement) {
        existingIds.add(replacement.id);
        editor.updateBlock(nativeBlock, { props: { data: JSON.stringify(replacement) } } as never);
      } else {
        editor.removeBlocks([nativeBlock]);
      }
    }
    const additions = next.filter((block) => !existingIds.has(block.id)).map(learningBlockToEditorBlock);
    if (additions.length) editor.insertBlocks(additions as never, editor.document.at(-1)!, "after");
    stateRef.current.learningBlocks = next;
    setLearningBlocks(next);
    scheduleSave();
  }

  function learningSlashItems() {
    return [
      { title: "Executable SQL", subtext: "Run with DuckDB or SQLite and save reviewed output", aliases: ["sql", "duckdb", "sqlite"], group: "Learning Examples", icon: <Database size={18} />, onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, learningBlockToEditorBlock(createLearningBlock("executable-code")) as never) },
      { title: "Formula Example", subtext: "DAX, Power Query M, Excel, or Google Sheets", aliases: ["formula", "dax", "excel"], group: "Learning Examples", icon: <Braces size={18} />, onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, learningBlockToEditorBlock(createLearningBlock("formula-example")) as never) },
      { title: "Automation Script", subtext: "VBA or Google Apps Script with saved output", aliases: ["vba", "apps script", "automation"], group: "Learning Examples", icon: <Workflow size={18} />, onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, learningBlockToEditorBlock(createLearningBlock("automation-script")) as never) },
      { title: "Callout", subtext: "Highlight note, tip, or warning", aliases: ["note", "tip", "warning", "aside"], group: "Rich Blocks", icon: <AlertTriangle size={18} />, onItemClick: () => editor.insertBlocks([{ type: "calloutBlock", props: { tone: "note", title: "Note" }, content: [{ type: "text", text: "ข้อความ callout", styles: {} }] }] as never, editor.document.at(-1)!, "after") },
      { title: "Toggle", subtext: "Collapsible section for details", aliases: ["details", "collapse", "expand"], group: "Rich Blocks", icon: <ChevronDown size={18} />, onItemClick: () => editor.insertBlocks([{ type: "toggleBlock", props: { title: "คลิกเพื่อเปิด", open: false }, content: [{ type: "text", text: "เนื้อหาที่ซ่อนอยู่", styles: {} }] }] as never, editor.document.at(-1)!, "after") },
      { title: "Quote", subtext: "Blockquote with optional attribution", aliases: ["blockquote", "cite"], group: "Rich Blocks", icon: <Quote size={18} />, onItemClick: () => editor.insertBlocks([{ type: "quoteBlock", props: { attribution: "" }, content: [{ type: "text", text: "ข้อความอ้างอิง", styles: {} }] }] as never, editor.document.at(-1)!, "after") },
      { title: "Image", subtext: "Embed image from URL or Media Library", aliases: ["img", "picture", "photo"], group: "Rich Blocks", icon: <Image size={18} />, onItemClick: () => editor.insertBlocks([{ type: "imageBlock", props: { src: "", alt: "", caption: "", width: 0, height: 0 } }] as never, editor.document.at(-1)!, "after") },
      { title: "Embed", subtext: "YouTube, Vimeo, or external link", aliases: ["youtube", "video", "iframe"], group: "Rich Blocks", icon: <Link2 size={18} />, onItemClick: () => editor.insertBlocks([{ type: "embedBlock", props: { url: "", embedType: "youtube", caption: "" } }] as never, editor.document.at(-1)!, "after") },
    ];
  }

  async function persistDraft(createRevision: boolean) {
    if (saving.current) {
      scheduleSave();
      return;
    }
    saving.current = true;
    setStatus("saving");
    setErrorMessage("");
    const current = stateRef.current;
    const isNew = !current.contentId;
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.contentId,
          title: current.title,
          slug: current.slug,
          excerpt: current.excerpt,
          categorySlug: current.categorySlug,
          tags: current.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          visibility: current.visibility,
          contentType: current.contentType,
          editorBlocks: editor.document,
          learningBlocks: current.learningBlocks,
          createRevision,
        }),
      });
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setErrorMessage(payload?.error === "Slug already exists" ? "Slug นี้ถูกใช้งานแล้ว กรุณาเปลี่ยน slug" : payload?.error === "Untrusted origin" ? "โดเมน Preview ยังไม่ได้รับอนุญาต กรุณาตรวจ Environment Variables" : payload?.error === "Sensitive data detected in learning block" ? "พบ credential, secret หรือ private network identifier ใน Learning Block กรุณานำออกก่อนบันทึก" : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        setStatus("error");
        return;
      }
      const saved = await response.json() as { id: string; slug: string };
      stateRef.current.contentId = saved.id;
      setContentId(saved.id);
      setSlug(saved.slug);
      setStatus("saved");
      if (isNew) router.replace(`/admin/content/${saved.id}/edit` as Route);
    } finally {
      saving.current = false;
    }
  }

  const statusText = status === "unsaved" ? "กรอกข้อมูลแล้วกดสร้างบทความ" : status === "saving" ? "กำลังบันทึก..." : status === "error" ? errorMessage || "บันทึกไม่สำเร็จ" : "บันทึกแล้วใน Database";

  return <div className="editor-page">
    <header className="editor-topbar">
      <div className="editor-back"><Link href="/admin/content"><ArrowLeft size={16} /> กลับไปเนื้อหา</Link><span className={`save-status ${status === "error" ? "error" : ""}`}>{status === "saved" && <Check size={13} />}{statusText}</span></div>
      <div className="editor-actions">
        {contentId && <div className="editor-export-actions"><a className="secondary-button" href={`/api/admin/content/${contentId}/export?format=markdown`}><Download size={14} /> Markdown</a><a className="secondary-button" href={`/api/admin/content/${contentId}/export?format=json`}><Download size={14} /> JSON</a></div>}
        {contentId && <Link className="secondary-button" href={`/admin/content/${contentId}/revisions` as Route}><History size={14} /> ประวัติ</Link>}
        {contentId ? <Link className="secondary-button" href={`/admin/content/${contentId}/preview` as Route}><Eye size={14} /> Preview</Link> : <button className="secondary-button" type="button" disabled><Eye size={14} /> Preview</button>}
        <button className="primary-button" type="button" disabled={status === "saving"} onClick={() => void persistDraft(true)}>{contentId ? "บันทึกฉบับร่าง" : "สร้างบทความ"}</button>
      </div>
    </header>
    <main className="editor-layout">
      <section>
        <input className="editor-title" value={title} onChange={(event) => { setTitle(event.target.value); scheduleSave(); }} aria-label="ชื่อเนื้อหา" />
        <div className="editor-properties"><span className="editor-property">สถานะ: {initialDraft?.contentStatus ?? "ยังไม่สร้าง"}</span><span className="editor-property">Visibility: {visibility}</span><span className="editor-property">ประเภท: {contentTypeLabels[contentType]}</span></div>
        <div className="blocknote-shell"><BlockNoteView editor={editor} theme="light" slashMenu={false} onChange={() => { const next = learningBlocksFromEditorBlocks(editor.document); stateRef.current.learningBlocks = next; setLearningBlocks(next); scheduleSave(); }}><SuggestionMenuController triggerCharacter="/" getItems={async (query) => filterSuggestionItems([...getDefaultReactSlashMenuItems(editor), ...learningSlashItems()], query)} /></BlockNoteView></div>
        <ExecutableCodeAuthoring blocks={learningBlocks.filter((block): block is Extract<LearningBlock, { type: "executable-code" }> => block.type === "executable-code")} onChange={(blocks) => applyLearningBlocks([...learningBlocks.filter((block) => block.type !== "executable-code"), ...blocks])} />
        <LearningBlockAuthoring blocks={learningBlocks.filter((block): block is Extract<LearningBlock, { type: "formula-example" | "automation-script" }> => block.type === "formula-example" || block.type === "automation-script")} onChange={(blocks) => applyLearningBlocks([...learningBlocks.filter((block) => block.type === "executable-code"), ...blocks])} />
      </section>
      <aside className="editor-aside">
        <h3>ข้อมูลเนื้อหา</h3>
        <div className="meta-field"><label>ประเภทบทความ</label><select value={contentType} onChange={(event) => { setContentType(event.target.value as EditorContentType); scheduleSave(); }}>{Object.entries(contentTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <div className="meta-field"><label>Slug</label><input value={slug} onChange={(event) => { setSlug(event.target.value); scheduleSave(); }} /></div>
        <div className="meta-field"><label>หมวดหมู่</label><select value={categorySlug} onChange={(event) => { setCategorySlug(event.target.value); scheduleSave(); }}><option value="">ยังไม่กำหนด</option>{taxonomy.categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></div>
        <div className="meta-field"><label>Tags</label><input value={tags} list="known-tags" onChange={(event) => { setTags(event.target.value); scheduleSave(); }} placeholder="คั่นแต่ละ tag ด้วย comma" /><datalist id="known-tags">{taxonomy.tags.map((tag) => <option value={tag} key={tag} />)}</datalist></div>
        <div className="meta-field"><label>Excerpt</label><textarea value={excerpt} onChange={(event) => { setExcerpt(event.target.value); scheduleSave(); }} placeholder="คำอธิบายสั้นสำหรับหน้า Library" /></div>
        <div className="meta-field"><label>Visibility</label><select value={visibility} onChange={(event) => { setVisibility(event.target.value as EditorDraft["visibility"]); scheduleSave(); }}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></div>
        <div className="ai-box"><strong><Sparkles size={13} /> AI Assistant</strong><p>AI จะสร้าง Suggested Version แยกจากต้นฉบับ และต้องผ่าน Diff ก่อนยอมรับ</p>{contentId ? <Link className="secondary-button" href={`/admin/ai?contentId=${contentId}` as Route}>ให้ AI ช่วยปรับ</Link> : <button className="secondary-button" type="button" disabled>สร้างบทความก่อนใช้ AI</button>}</div>
      </aside>
    </main>
  </div>;
}
