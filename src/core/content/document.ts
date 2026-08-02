import { z } from "zod";
import { createSlug } from "./slug";
import type { ContentBlock } from "./types";

const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("paragraph"), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("callout"), tone: z.enum(["note", "tip", "warning"]), title: z.string(), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("code"), language: z.string(), filename: z.string().optional(), code: z.string() }),
  z.object({ id: z.string(), type: z.literal("toggle"), title: z.string(), text: z.string(), open: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("list"), items: z.array(z.string()) }),
]);

const storedDocumentSchema = z.object({
  version: z.literal(1),
  readerBlocks: z.array(contentBlockSchema),
  editorBlocks: z.array(z.unknown()).optional(),
});

export interface StoredContentDocument {
  version: 1;
  readerBlocks: ContentBlock[];
  editorBlocks?: unknown[];
}

export interface ContentHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

export interface ContentArtifacts {
  blocks: ContentBlock[];
  plainText: string;
  html: string;
  headings: ContentHeading[];
}

export function createStoredDocument(readerBlocks: ContentBlock[], editorBlocks?: unknown[]): StoredContentDocument {
  return { version: 1, readerBlocks, editorBlocks };
}

export function parseStoredDocument(value: unknown): StoredContentDocument {
  const stored = storedDocumentSchema.safeParse(value);
  if (stored.success) return stored.data;

  const legacyBlocks = z.array(contentBlockSchema).safeParse(value);
  return createStoredDocument(legacyBlocks.success ? legacyBlocks.data : []);
}

type EditorInline = { type?: string; text?: string };
type EditorBlock = { id?: string; type?: string; props?: Record<string, unknown>; content?: EditorInline[] | string; children?: EditorBlock[] };

function editorText(block: EditorBlock): string {
  if (typeof block.content === "string") return block.content;
  return (block.content ?? []).map((item) => item.text ?? "").join("");
}

export function editorBlocksToReaderBlocks(value: unknown[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  const listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    result.push({ id: `list-${result.length}`, type: "list", items: listItems.splice(0) });
  };

  for (const raw of value) {
    const block = raw as EditorBlock;
    const id = block.id ?? `block-${result.length}`;
    const text = editorText(block);

    if (block.type === "bulletListItem" || block.type === "numberedListItem" || block.type === "checkListItem") {
      if (text) listItems.push(text);
      continue;
    }

    flushList();
    if (block.type === "heading") {
      result.push({ id, type: "heading", level: block.props?.level === 3 ? 3 : 2, text });
    } else if (block.type === "codeBlock") {
      result.push({ id, type: "code", language: String(block.props?.language ?? "text"), code: text });
    } else if (text) {
      result.push({ id, type: "paragraph", text });
    }
  }

  flushList();
  return result;
}

export function blocksPlainText(blocks: ContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "list") return block.items.join(" ");
    if (block.type === "code") return block.code;
    if (block.type === "callout" || block.type === "toggle") return `${block.title} ${block.text}`;
    return block.text;
  }).join("\n");
}

export function buildContentArtifacts(blocks: ContentBlock[]): ContentArtifacts {
  const counts = new Map<string, number>();
  const normalized = blocks.map((block) => {
    if (block.type !== "heading") return block;
    const base = createSlug(block.text) || "section";
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return { ...block, id: count === 1 ? base : `${base}-${count}` };
  });
  return {
    blocks: normalized,
    plainText: blocksPlainText(normalized),
    html: blocksToSafeHtml(normalized),
    headings: normalized.flatMap((block) => block.type === "heading" ? [{ id: block.id, level: block.level, text: block.text }] : []),
  };
}

export function blocksToSafeHtml(blocks: ContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "paragraph") return `<p>${escapeText(block.text)}</p>`;
    if (block.type === "heading") return `<h${block.level} id="${escapeAttribute(block.id)}">${escapeText(block.text)}</h${block.level}>`;
    if (block.type === "list") return `<ul>${block.items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>`;
    if (block.type === "callout") return `<aside class="callout ${block.tone}"><strong>${escapeText(block.title)}</strong><p>${escapeText(block.text)}</p></aside>`;
    if (block.type === "toggle") return `<details${block.open ? " open" : ""}><summary>${escapeText(block.title)}</summary><p>${escapeText(block.text)}</p></details>`;
    const language = block.language.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "text";
    return `<pre><code class="language-${language}">${escapeHtml(block.code)}</code></pre>`;
  }).join("\n");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeText(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/\s+/g, "-");
}

export function readerBlocksToEditorBlocks(blocks: ContentBlock[]): unknown[] {
  return blocks.flatMap((block) => {
    if (block.type === "heading") return [{ id: block.id, type: "heading", props: { level: block.level }, content: [{ type: "text", text: block.text, styles: {} }], children: [] }];
    if (block.type === "code") return [{ id: block.id, type: "codeBlock", props: { language: block.language }, content: [{ type: "text", text: block.code, styles: {} }], children: [] }];
    if (block.type === "list") return block.items.map((item, index) => ({ id: `${block.id}-${index}`, type: "bulletListItem", content: [{ type: "text", text: item, styles: {} }], children: [] }));
    const text = block.type === "callout" || block.type === "toggle" ? `${block.title}: ${block.text}` : block.text;
    return [{ id: block.id, type: "paragraph", content: [{ type: "text", text, styles: {} }], children: [] }];
  });
}
