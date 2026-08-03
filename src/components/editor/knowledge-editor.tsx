"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { ArrowLeft, Check, Download, Eye, History, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EditorContentType, EditorDraft, EditorTaxonomyOptions } from "@/core/content/editor-service";

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
  const editor = useCreateBlockNote({ initialContent: (initialDraft?.editorBlocks as PartialBlock[]) ?? initialContent });
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const stateRef = useRef({ contentId, title, slug, excerpt, categorySlug, tags, visibility, contentType });
  stateRef.current = { contentId, title, slug, excerpt, categorySlug, tags, visibility, contentType };

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
          createRevision,
        }),
      });
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setErrorMessage(payload?.error === "Slug already exists" ? "Slug นี้ถูกใช้งานแล้ว กรุณาเปลี่ยน slug" : payload?.error === "Untrusted origin" ? "โดเมน Preview ยังไม่ได้รับอนุญาต กรุณาตรวจ Environment Variables" : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
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
        <div className="blocknote-shell"><BlockNoteView editor={editor} theme="light" onChange={scheduleSave} /></div>
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
