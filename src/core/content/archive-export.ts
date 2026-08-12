import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "./document";
import type { ContentBlock } from "./types";

export interface ArchiveEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentType: string;
  status: string;
  visibility: string;
  category: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  readingTime: number;
  blocks: ContentBlock[];
  sources: { url: string; title: string | null; author: string | null }[];
  relations: { title: string; slug: string; relationType: string }[];
}

export interface ContentArchive {
  exportedAt: string;
  siteName: string;
  totalContent: number;
  entries: ArchiveEntry[];
}

/**
 * Export all non-deleted content as a full archive.
 * Includes blocks, taxonomy, sources, and relations.
 */
export async function exportFullArchive(): Promise<ContentArchive> {
  const contents = await prisma.content.findMany({
    where: { deletedAt: null },
    include: {
      category: { select: { name: true } },
      tags: { include: { tag: { select: { name: true } } } },
      sources: { select: { url: true, title: true, author: true } },
      outgoingRelations: {
        include: { targetContent: { select: { title: true, slug: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const siteSetting = await prisma.siteSetting.findUnique({ where: { key: "siteName" } });
  const siteName = (siteSetting?.valueJson as string) || "Knowledge Hub";

  const entries: ArchiveEntry[] = contents.map((content) => {
    const stored = parseStoredDocument(content.contentJson);
    return {
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt ?? "",
      contentType: content.contentType,
      status: content.status,
      visibility: content.visibility,
      category: content.category?.name ?? null,
      tags: content.tags.map(({ tag }) => tag.name),
      publishedAt: content.publishedAt?.toISOString() ?? null,
      updatedAt: content.updatedAt.toISOString(),
      readingTime: content.readingTime,
      blocks: stored.readerBlocks,
      sources: content.sources.map((s) => ({ url: s.url, title: s.title, author: s.author })),
      relations: content.outgoingRelations.map((r) => ({
        title: r.targetContent.title,
        slug: r.targetContent.slug,
        relationType: r.relationType,
      })),
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    siteName,
    totalContent: entries.length,
    entries,
  };
}

/**
 * Export a single content item as HTML.
 */
export async function exportSingleHtml(contentId: string): Promise<string> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { category: { select: { name: true } }, tags: { include: { tag: { select: { name: true } } } } },
  });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");

  const tags = content.tags.map(({ tag }) => tag.name).join(", ");
  const category = content.category?.name ?? "";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <meta name="description" content="${content.excerpt ?? ""}">
  <style>
    body { max-width: 760px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; line-height: 1.8; color: #20212a; }
    h1 { font-size: 2.2rem; margin-bottom: 8px; }
    .meta { color: #71717f; font-size: .85rem; margin-bottom: 30px; }
    .excerpt { color: #71717f; font-size: 1.05rem; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e7e5e4; }
    h2 { margin-top: 40px; }
    h3 { margin-top: 30px; }
    pre { background: #20212b; color: #e9e7f5; padding: 20px; border-radius: 12px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; font-size: .85rem; }
    blockquote { border-left: 4px solid #6d5dfc; margin: 20px 0; padding: 10px 20px; background: #f7f6f3; }
    .callout { padding: 16px; border-radius: 12px; margin: 20px 0; background: #eeecff; }
    .callout-title { font-weight: 700; margin-bottom: 4px; }
    .toggle { border: 1px solid #e7e5e4; border-radius: 10px; padding: 14px; margin: 16px 0; }
    .toggle summary { font-weight: 700; cursor: pointer; }
    .toggle p { margin-top: 10px; color: #71717f; }
    footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e7e5e4; color: #71717f; font-size: .8rem; }
  </style>
</head>
<body>
  <h1>${content.title}</h1>
  <div class="meta">${category}${category && tags ? " · " : ""}${tags} · ${content.updatedAt.toISOString().slice(0, 10)} · ${content.readingTime} นาที</div>
  ${content.excerpt ? `<p class="excerpt">${content.excerpt}</p>` : ""}
  ${content.contentHtml || ""}
  <footer>ส่งออกจาก Knowledge Hub · ${new Date().toISOString().slice(0, 10)}</footer>
</body>
</html>`;
}

export interface MediaManifestEntry {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  publicUrl: string | null;
  usedInContent: string[];
}

export interface MediaManifest {
  exportedAt: string;
  totalMedia: number;
  entries: MediaManifestEntry[];
}

/**
 * Export a manifest of all media files with usage information.
 */
export async function exportMediaManifest(): Promise<MediaManifest> {
  const media = await prisma.media.findMany({
    include: {
      coverFor: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const entries: MediaManifestEntry[] = media.map((m) => ({
    id: m.id,
    fileName: m.fileName,
    mimeType: m.mimeType,
    fileSize: m.fileSize,
    width: m.width,
    height: m.height,
    altText: m.altText,
    publicUrl: m.publicUrl,
    usedInContent: m.coverFor.map((c) => c.title),
  }));

  return {
    exportedAt: new Date().toISOString(),
    totalMedia: entries.length,
    entries,
  };
}
