"use client";

import type { ComponentProps } from "react";
import MarkdownEditor from "@/app/_components/markdown-editor";

type MarkdownEditorClientProps = ComponentProps<typeof MarkdownEditor>;

export default function MarkdownEditorClient(props: MarkdownEditorClientProps) {
  return <MarkdownEditor {...props} />;
}