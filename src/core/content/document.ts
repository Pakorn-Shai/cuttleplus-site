import { z } from "zod";
import { blockToPlainText, blockToSafeHtml } from "./blocks/registry";
import { contentBlockSchema } from "./blocks/schema";
import { createSlug } from "./slug";
import type { ContentBlock } from "./types";

export { contentBlockSchema, structuredOutputSchema } from "./blocks/schema";

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
  return blocks.map(blockToPlainText).join("\n");
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
  return blocks.map(blockToSafeHtml).join("\n");
}

export function readerBlocksToEditorBlocks(blocks: ContentBlock[]): unknown[] {
  return blocks.flatMap((block) => {
    if (block.type === "heading") return [{ id: block.id, type: "heading", props: { level: block.level }, content: [{ type: "text", text: block.text, styles: {} }], children: [] }];
    if (block.type === "code") return [{ id: block.id, type: "codeBlock", props: { language: block.language }, content: [{ type: "text", text: block.code, styles: {} }], children: [] }];
    if (block.type === "list") return block.items.map((item, index) => ({ id: `${block.id}-${index}`, type: "bulletListItem", content: [{ type: "text", text: item, styles: {} }], children: [] }));
    if (block.type === "executable-code") return [{ id: block.id, type: "codeBlock", props: { language: block.language }, content: [{ type: "text", text: block.code, styles: {} }], children: [] }];
    if (block.type === "formula-example") return [{ id: block.id, type: "codeBlock", props: { language: block.engine }, content: [{ type: "text", text: block.expression, styles: {} }], children: [] }];
    if (block.type === "automation-script") return [{ id: block.id, type: "codeBlock", props: { language: block.platform === "google-apps-script" ? "javascript" : "vb" }, content: [{ type: "text", text: block.code, styles: {} }], children: [] }];
    const text = block.type === "callout" || block.type === "toggle" ? `${block.title}: ${block.text}` : block.text;
    return [{ id: block.id, type: "paragraph", content: [{ type: "text", text, styles: {} }], children: [] }];
  });
}
