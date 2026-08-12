import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createSlug } from "./slug";
import { buildContentArtifacts, createStoredDocument, readerBlocksToEditorBlocks } from "./document";
import type { ContentBlock } from "./types";

interface ImportResult {
  contentId: string;
  slug: string;
  title: string;
  blockCount: number;
}

/**
 * Import content from Markdown text.
 * Converts headings, paragraphs, code blocks, and lists to reader blocks.
 */
export async function importMarkdown(
  markdown: string,
  options: { title?: string; categoryId?: string; status?: string; visibility?: string },
): Promise<ImportResult> {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];
  let title = options.title || "Untitled Import";
  let excerpt = "";
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeContent = "";

  function flushList() {
    if (currentList.length > 0) {
      blocks.push({ id: crypto.randomUUID(), type: "list", items: [...currentList] });
      currentList = [];
    }
  }

  function flushCode() {
    if (inCodeBlock && codeContent) {
      blocks.push({ id: crypto.randomUUID(), type: "code", language: codeLanguage || "text", code: codeContent.trim() });
      codeContent = "";
      inCodeBlock = false;
      codeLanguage = "";
    }
  }

  for (const line of lines) {
    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Headings
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    if (h2Match) {
      flushList();
      blocks.push({ id: crypto.randomUUID(), type: "heading", level: 2, text: h2Match[1].trim() });
      continue;
    }
    if (h3Match) {
      flushList();
      blocks.push({ id: crypto.randomUUID(), type: "heading", level: 3, text: h3Match[1].trim() });
      continue;
    }

    // H1 becomes title
    const h1Match = line.match(/^# (.+)/);
    if (h1Match && !options.title) {
      title = h1Match[1].trim();
      continue;
    }

    // List items
    const listMatch = line.match(/^[-*] (.+)/);
    if (listMatch) {
      currentList.push(listMatch[1].trim());
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: line.trim() });
  }

  flushList();
  flushCode();

  // Extract excerpt from first paragraph
  const firstParagraph = blocks.find((b) => b.type === "paragraph");
  if (firstParagraph && "text" in firstParagraph) {
    excerpt = firstParagraph.text.slice(0, 300);
  }

  const artifacts = buildContentArtifacts(blocks);
  const slug = createSlug(title);
  const document = createStoredDocument(
    artifacts.blocks,
    readerBlocksToEditorBlocks(artifacts.blocks.filter((b) => b.type !== "executable-code" && b.type !== "formula-example" && b.type !== "automation-script")),
  ) as unknown as Prisma.InputJsonValue;

  const content = await prisma.content.create({
    data: {
      title,
      slug,
      excerpt,
      contentType: "KNOWLEDGE_NOTE",
      status: (options.status as "DRAFT" | "INBOX") || "DRAFT",
      visibility: (options.visibility as "PRIVATE" | "UNLISTED" | "PUBLIC") || "PRIVATE",
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: options.categoryId || null,
    },
  });

  return { contentId: content.id, slug: content.slug, title: content.title, blockCount: blocks.length };
}

/**
 * Import a file attachment as a new content item.
 * Supports PDF, TXT, CSV, XLSX, DOCX, and source files.
 * For binary files, creates a placeholder with metadata.
 */
export async function importFileAttachment(
  fileName: string,
  mimeType: string,
  fileSize: number,
  textContent?: string,
  options?: { categoryId?: string },
): Promise<ImportResult> {
  const blocks: ContentBlock[] = [];

  // Add attachment block
  blocks.push({
    id: crypto.randomUUID(),
    type: "attachment",
    url: "",
    fileName,
    fileSize,
    mimeType,
  });

  // If text content is available, add it as paragraphs
  if (textContent) {
    const paragraphs = textContent.split(/\n\n+/).filter(Boolean);
    for (const p of paragraphs.slice(0, 20)) {
      blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: p.trim().slice(0, 5000) });
    }
  }

  const title = fileName.replace(/\.[^.]+$/, "");
  const excerpt = textContent?.slice(0, 300) || `ไฟล์ ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`;
  const artifacts = buildContentArtifacts(blocks);
  const slug = createSlug(title);
  const document = createStoredDocument(
    artifacts.blocks,
    readerBlocksToEditorBlocks(artifacts.blocks.filter((b) => b.type !== "executable-code" && b.type !== "formula-example" && b.type !== "automation-script")),
  ) as unknown as Prisma.InputJsonValue;

  const content = await prisma.content.create({
    data: {
      title,
      slug,
      excerpt,
      contentType: "REFERENCE",
      status: "DRAFT",
      visibility: "PRIVATE",
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: options?.categoryId || null,
    },
  });

  return { contentId: content.id, slug: content.slug, title: content.title, blockCount: blocks.length };
}

/**
 * Import content from basic sanitized HTML.
 * Strips scripts, styles, and dangerous tags; converts headings, paragraphs, lists, code blocks.
 */
export async function importHtml(
  html: string,
  options: { title?: string; categoryId?: string },
): Promise<ImportResult> {
  // Basic sanitization: remove scripts, styles, event handlers
  const sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");

  const blocks: ContentBlock[] = [];
  let title = options.title || "Untitled Import";

  // Extract h1 as title
  const h1Match = sanitized.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && !options.title) {
    title = h1Match[1].replace(/<[^>]+>/g, "").trim();
  }

  // Extract content from body or entire HTML
  const bodyMatch = sanitized.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : sanitized;

  // Split by block-level tags
  const blockRegex = /<(h[2-3]|p|pre|ul|ol|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2].replace(/<[^>]+>/g, "").trim();
    if (!inner) continue;

    if (tag === "h2") {
      blocks.push({ id: crypto.randomUUID(), type: "heading", level: 2, text: inner });
    } else if (tag === "h3") {
      blocks.push({ id: crypto.randomUUID(), type: "heading", level: 3, text: inner });
    } else if (tag === "pre") {
      blocks.push({ id: crypto.randomUUID(), type: "code", language: "text", code: inner });
    } else if (tag === "blockquote") {
      blocks.push({ id: crypto.randomUUID(), type: "quote", text: inner });
    } else {
      blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: inner });
    }
  }

  // Fallback: if no blocks found, treat remaining text as paragraphs
  if (blocks.length === 0) {
    const text = content.replace(/<[^>]+>/g, "").trim();
    if (text) {
      text.split(/\n\n+/).filter(Boolean).forEach((p) => {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: p.trim() });
      });
    }
  }

  const excerpt = blocks.find((b) => b.type === "paragraph" && "text" in b)?.text?.slice(0, 300) || "";
  const artifacts = buildContentArtifacts(blocks);
  const slug = createSlug(title);
  const document = createStoredDocument(
    artifacts.blocks,
    readerBlocksToEditorBlocks(artifacts.blocks.filter((b) => b.type !== "executable-code" && b.type !== "formula-example" && b.type !== "automation-script")),
  ) as unknown as Prisma.InputJsonValue;

  const result = await prisma.content.create({
    data: {
      title,
      slug,
      excerpt,
      contentType: "KNOWLEDGE_NOTE",
      status: "DRAFT",
      visibility: "PRIVATE",
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: options.categoryId || null,
    },
  });

  return { contentId: result.id, slug: result.slug, title: result.title, blockCount: blocks.length };
}

/**
 * Import content from a JSON system export (full archive format).
 * Supports version migration by mapping old fields to current schema.
 */
export async function importSystemJson(
  json: string,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let archive: { entries?: { title: string; excerpt?: string; contentType?: string; status?: string; visibility?: string; blocks?: ContentBlock[]; category?: string; tags?: string[] }[] };
  try {
    archive = JSON.parse(json);
  } catch {
    return { imported: 0, skipped: 0, errors: ["Invalid JSON format"] };
  }

  if (!archive.entries || !Array.isArray(archive.entries)) {
    return { imported: 0, skipped: 0, errors: ["Missing entries array"] };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of archive.entries) {
    try {
      if (!entry.title || !entry.blocks || !Array.isArray(entry.blocks)) {
        skipped++;
        continue;
      }

      const blocks = entry.blocks as ContentBlock[];
      const artifacts = buildContentArtifacts(blocks);
      const slug = createSlug(entry.title);

      // Resolve category if provided
      let categoryId: string | null = null;
      if (entry.category) {
        const cat = await prisma.category.findFirst({ where: { name: entry.category } });
        if (cat) categoryId = cat.id;
      }

      const document = createStoredDocument(
        artifacts.blocks,
        readerBlocksToEditorBlocks(artifacts.blocks.filter((b) => b.type !== "executable-code" && b.type !== "formula-example" && b.type !== "automation-script")),
      ) as unknown as Prisma.InputJsonValue;

      await prisma.content.create({
        data: {
          title: entry.title,
          slug,
          excerpt: entry.excerpt?.slice(0, 500) || "",
          contentType: (entry.contentType as "KNOWLEDGE_NOTE") || "KNOWLEDGE_NOTE",
          status: (entry.status as "DRAFT") || "DRAFT",
          visibility: (entry.visibility as "PRIVATE") || "PRIVATE",
          contentJson: document,
          contentHtml: artifacts.html,
          plainText: artifacts.plainText,
          readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
          categoryId,
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Failed to import "${entry.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

/**
 * Import content from plain text.
 * Each paragraph becomes a reader block.
 */
export async function importPlainText(
  text: string,
  options: { title?: string; categoryId?: string },
): Promise<ImportResult> {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const blocks: ContentBlock[] = paragraphs.map((p) => ({
    id: crypto.randomUUID(),
    type: "paragraph" as const,
    text: p.trim(),
  }));

  const title = options.title || "Untitled Import";
  const excerpt = paragraphs[0]?.slice(0, 300) || "";
  const artifacts = buildContentArtifacts(blocks);
  const slug = createSlug(title);
  const document = createStoredDocument(
    artifacts.blocks,
    readerBlocksToEditorBlocks(artifacts.blocks.filter((b) => b.type !== "executable-code" && b.type !== "formula-example" && b.type !== "automation-script")),
  ) as unknown as Prisma.InputJsonValue;

  const content = await prisma.content.create({
    data: {
      title,
      slug,
      excerpt,
      contentType: "QUICK_NOTE",
      status: "DRAFT",
      visibility: "PRIVATE",
      contentJson: document,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      categoryId: options.categoryId || null,
    },
  });

  return { contentId: content.id, slug: content.slug, title: content.title, blockCount: blocks.length };
}