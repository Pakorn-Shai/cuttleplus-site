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
  const [value, setValue] = useState(defaultValue);
  const isClient = typeof window !== "undefined";

  // Render a textarea fallback during SSR
  if (!isClient) {
    return (
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={12}
        className="resize-y rounded-lg border border-black/15 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-black/40 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-white/20 dark:bg-white/5 dark:placeholder:text-white/40"
      />
    );
  }

  return (
    <div className="markdown-editor-wrapper" data-color-mode="light">
      <input type="hidden" name={name} value={value} />
      <MDEditor
        value={value}
        onChange={(newValue) => setValue(newValue || "")}
        height={400}
        preview="live"
        visibleDragbar={false}
        textareaProps={{
          required,
          placeholder: "Write your post content in Markdown format...",
        }}
        style={{
          borderRadius: "0.5rem",
          border: "1px solid rgba(0, 0, 0, 0.15)",
          backgroundColor: "white",
          overflow: "hidden",
        }}
      />
      <div className="mt-3 text-xs text-black/60 dark:text-white/60">
        <p>
          Supports <strong>Markdown</strong> formatting (headings, lists, links,
          code blocks, etc.). Use the toolbar above for common formatting.
        </p>
      </div>
    </div>
  );
}
