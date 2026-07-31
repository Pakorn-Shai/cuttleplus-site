"use client";

import dynamic from "next/dynamic";
import type { EditorDraft } from "@/core/content/editor-service";

const KnowledgeEditor = dynamic(
  () => import("./knowledge-editor").then((module) => module.KnowledgeEditor),
  {
    ssr: false,
    loading: () => (
      <main className="editor-page" aria-live="polite">
        <header className="editor-topbar"><span className="save-status">กำลังโหลด Block Editor...</span></header>
        <div className="editor-layout"><section><div style={{ width: "65%", height: 50, borderRadius: 10, background: "#f1f1f3" }} /><div style={{ height: 260, marginTop: 30, borderRadius: 14, background: "#f7f7f8" }} /></section></div>
      </main>
    ),
  },
);

export function EditorLoader({ initialDraft }: { initialDraft?: EditorDraft }) {
  return <KnowledgeEditor initialDraft={initialDraft} />;
}
