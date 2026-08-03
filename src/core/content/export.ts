import { blockToMarkdown } from "./blocks/registry";
import type { ContentBlock } from "./types";

export interface ExportableContent {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  excerpt?: string | null;
  contentType: string;
  status: string;
  visibility: string;
  featured: boolean;
  readingTime: number;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: { name: string; slug: string } | null;
  tags: string[];
  blocks: ContentBlock[];
}

function yamlString(value: string) {
  return JSON.stringify(value);
}

export function blocksToMarkdown(blocks: ContentBlock[]) {
  return blocks.map(blockToMarkdown).join("\n\n");
}

export function contentToMarkdown(content: ExportableContent) {
  const frontmatter = [
    "---",
    `title: ${yamlString(content.title)}`,
    `slug: ${yamlString(content.slug)}`,
    `type: ${yamlString(content.contentType)}`,
    `status: ${yamlString(content.status)}`,
    `visibility: ${yamlString(content.visibility)}`,
    `excerpt: ${yamlString(content.excerpt ?? "")}`,
    `category: ${yamlString(content.category?.slug ?? "")}`,
    `tags: ${JSON.stringify(content.tags)}`,
    `updatedAt: ${yamlString(new Date(content.updatedAt).toISOString())}`,
    "---",
  ].join("\n");
  return `${frontmatter}\n\n${blocksToMarkdown(content.blocks)}\n`;
}

export function contentToJson(content: ExportableContent, exportedAt = new Date()) {
  return JSON.stringify({
    exportVersion: 1,
    exportedAt: exportedAt.toISOString(),
    content: {
      ...content,
      createdAt: new Date(content.createdAt).toISOString(),
      updatedAt: new Date(content.updatedAt).toISOString(),
      publishedAt: content.publishedAt ? new Date(content.publishedAt).toISOString() : null,
    },
  }, null, 2) + "\n";
}
