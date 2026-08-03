"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import { ArrowLeft, Check, Eye, History, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EditorDraft, EditorTaxonomyOptions } from "@/core/content/editor-service";

const initialContent = [
  { type: "paragraph" as const, content: "เริ่มเขียนสิ่งที่เรียนรู้ได้เลย หรือพิมพ์ / เพื่อเลือก Block" },
  { type: "heading" as const, props: { level: 2 as const }, content: "หัวข้อสำคัญ" },
  { type: "bulletListItem" as const, content: "เพิ่มบริบทและตัวอย่างที่นำไปใช้ได้" },
  { type: "codeBlock" as const, props: { language: "typescript" }, content: "const knowledge = { readable: true, searchable: true };" },
];

export function KnowledgeEditor({ initialDraft, taxonomy }: { initialDraft?: EditorDraft; taxonomy: EditorTaxonomyOptions }) {
  const editor = useCreateBlockNote({ initialContent: (initialDraft?.editorBlocks as PartialBlock[]) ?? initialContent });
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [contentId, setContentId] = useState(initialDraft?.id);
  const [title, setTitle] = useState(initialDraft?.title ?? "บทความใหม่ที่กำลังเรียนรู้");
  const [slug, setSlug] = useState(initialDraft?.slug ?? "บทความใหม่ที่กำลังเรียนรู้");
  const [excerpt, setExcerpt] = useState(initialDraft?.excerpt ?? "");
  const [categorySlug, setCategorySlug] = useState(initialDraft?.categorySlug ?? "");
  const [tags, setTags] = useState(initialDraft?.tags.join(", ") ?? "");
  const [visibility, setVisibility] = useState<EditorDraft["visibility"]>(initialDraft?.visibility ?? "private");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const stateRef = useRef({ contentId, title, slug, excerpt, categorySlug, tags, visibility });
  stateRef.current = { contentId, title, slug, excerpt, categorySlug, tags, visibility };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function scheduleSave() {
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
    try {
      const response = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: current.contentId, title: current.title, slug: current.slug, excerpt: current.excerpt, categorySlug: current.categorySlug, tags: current.tags.split(",").map((tag) => tag.trim()).filter(Boolean), visibility: current.visibility, editorBlocks: editor.document, createRevision }) });
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
    } finally {
      saving.current = false;
    }
  }

  const statusText = status === "saving" ? "กำลังบันทึก..." : status === "error" ? errorMessage || "บันทึกไม่สำเร็จ" : "บันทึกแล้วใน Database";
  return <div className="editor-page"><header className="editor-topbar"><div className="editor-back"><Link href="/admin/content"><ArrowLeft size={16} /> กลับไปเนื้อหา</Link><span className={`save-status ${status === "error" ? "error" : ""}`}>{status === "saved" && <Check size={13} />}{statusText}</span></div><div className="editor-actions">{contentId && <Link className="secondary-button" href={`/admin/content/${contentId}/revisions` as Route}><History size={14} /> ประวัติ</Link>}{contentId ? <Link className="secondary-button" href={`/admin/content/${contentId}/preview` as Route}><Eye size={14} /> Preview</Link> : <button className="secondary-button" type="button" disabled><Eye size={14} /> Preview</button>}<button className="primary-button" onClick={() => void persistDraft(true)}>บันทึกฉบับร่าง</button></div></header><main className="editor-layout"><section><input className="editor-title" value={title} onChange={(event) => { setTitle(event.target.value); scheduleSave(); }} aria-label="ชื่อเนื้อหา" /><div className="editor-properties"><span className="editor-property">สถานะ: Draft</span><span className="editor-property">Visibility: {visibility}</span><span className="editor-property">ประเภท: Knowledge Note</span></div><div className="blocknote-shell"><BlockNoteView editor={editor} theme="light" onChange={scheduleSave} /></div></section><aside className="editor-aside"><h3>ข้อมูลเนื้อหา</h3><div className="meta-field"><label>Slug</label><input value={slug} onChange={(event) => { setSlug(event.target.value); scheduleSave(); }} /></div><div className="meta-field"><label>หมวดหมู่</label><select value={categorySlug} onChange={(event) => { setCategorySlug(event.target.value); scheduleSave(); }}><option value="">ยังไม่กำหนด</option>{taxonomy.categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></div><div className="meta-field"><label>Tags</label><input value={tags} list="known-tags" onChange={(event) => { setTags(event.target.value); scheduleSave(); }} placeholder="คั่นแต่ละ tag ด้วย comma" /><datalist id="known-tags">{taxonomy.tags.map((tag) => <option value={tag} key={tag} />)}</datalist></div><div className="meta-field"><label>Excerpt</label><textarea value={excerpt} onChange={(event) => { setExcerpt(event.target.value); scheduleSave(); }} placeholder="คำอธิบายสั้นสำหรับหน้า Library" /></div><div className="meta-field"><label>Visibility</label><select value={visibility} onChange={(event) => { setVisibility(event.target.value as EditorDraft["visibility"]); scheduleSave(); }}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></div><div className="ai-box"><strong><Sparkles size={13} /> AI Assistant</strong><p>AI จะสร้าง Suggested Version แยกจากต้นฉบับ และต้องผ่าน Diff ก่อนยอมรับ</p>{contentId ? <Link className="secondary-button" href={`/admin/ai?contentId=${contentId}` as Route}>ให้ AI ช่วยปรับ</Link> : <button className="secondary-button" type="button" disabled>บันทึกก่อนใช้ AI</button>}</div></aside></main></div>;
}
