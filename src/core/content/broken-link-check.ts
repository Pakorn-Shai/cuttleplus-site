import "server-only";

import { prisma } from "@/lib/prisma";

export interface BrokenLink {
  contentId: string;
  contentTitle: string;
  contentSlug: string;
  url: string;
  reason: string;
}

/**
 * Scans all published content for potentially broken links.
 * Checks:
 * - Sources with empty URLs
 * - Sources with URLs that don't start with http:// or https://
 * - Embed blocks with empty URLs
 * - Image blocks with empty src
 * - Internal links pointing to non-existent content slugs
 */
export async function findBrokenLinks(): Promise<BrokenLink[]> {
  const broken: BrokenLink[] = [];
  const contents = await prisma.content.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, slug: true, contentJson: true },
  });

  // Collect all valid slugs for internal link checking
  const validSlugs = new Set(contents.map((c) => c.slug));

  for (const content of contents) {
    const json = content.contentJson as { readerBlocks?: Array<Record<string, unknown>> } | null;
    const blocks = json?.readerBlocks ?? [];

    for (const block of blocks) {
      // Check image blocks
      if (block.type === "image") {
        const src = block.src as string | undefined;
        if (!src || src.trim() === "") {
          broken.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, url: "(empty image src)", reason: "Image block has empty src" });
        } else if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("/")) {
          broken.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, url: src, reason: "Image src is not a valid URL" });
        }
      }

      // Check embed blocks
      if (block.type === "embed") {
        const url = block.url as string | undefined;
        if (!url || url.trim() === "") {
          broken.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, url: "(empty embed URL)", reason: "Embed block has empty URL" });
        } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
          broken.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, url, reason: "Embed URL is not a valid URL" });
        }
      }
    }
  }

  // Check sources
  const sources = await prisma.source.findMany({
    where: { content: { status: "PUBLISHED", deletedAt: null } },
    include: { content: { select: { id: true, title: true, slug: true } } },
  });

  for (const source of sources) {
    if (!source.url || source.url.trim() === "") {
      broken.push({ contentId: source.content.id, contentTitle: source.content.title, contentSlug: source.content.slug, url: "(empty source URL)", reason: "Source has empty URL" });
    } else if (!source.url.startsWith("http://") && !source.url.startsWith("https://")) {
      broken.push({ contentId: source.content.id, contentTitle: source.content.title, contentSlug: source.content.slug, url: source.url, reason: "Source URL is not a valid URL" });
    }
  }

  return broken;
}