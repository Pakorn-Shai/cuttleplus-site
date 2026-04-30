"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export default function MarkdownEditor({
  name,
  defaultValue = "",
  required = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue);

  return (
    <div className="markdown-editor-wrapper" data-color-mode="light">
      <input type="hidden" name={name} value={content} />
      <MDEditor
        value={content}
        onChange={(newValue) => setContent(newValue || "")}
        height={400}
        preview="live"
        visibleDragbar={false}
        textareaProps={{
          required,
          placeholder: "Write your post content in Markdown format...",
        }}
        style={{
          borderRadius: "0.5rem",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          overflow: "hidden",
        }}
      />
      <div className="mt-3 text-xs text-muted">
        <div>
          Supports <strong>Markdown</strong> formatting (headings, lists, links,
          code blocks, etc.). Use the toolbar above for common formatting.
        </div>
      </div>
    </div>
  );
}
