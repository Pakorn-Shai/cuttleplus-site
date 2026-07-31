import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "./document";
import type { CategorySummary, ContentKind, ContentStatus, KnowledgeContent } from "./types";

export interface ContentRepository {
  listPublic(): Promise<KnowledgeContent[]>;
  listPublishedRoutes(): Promise<KnowledgeContent[]>;
  listAll(): Promise<KnowledgeContent[]>;
  findPublicBySlug(slug: string): Promise<KnowledgeContent | null>;
  searchPublic(query: string): Promise<KnowledgeContent[]>;
  listCategories(): Promise<CategorySummary[]>;
}

const contentInclude = {
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ContentInclude;

type ContentRecord = Prisma.ContentGetPayload<{ include: typeof contentInclude }>;

class PrismaContentRepository implements ContentRepository {
  async listPublic() {
    const contents = await prisma.content.findMany({
      where: { visibility: "PUBLIC", status: "PUBLISHED", deletedAt: null },
      include: contentInclude,
      orderBy: { updatedAt: "desc" },
    });
    return contents.map(mapContent);
  }

  async listPublishedRoutes() {
    const contents = await prisma.content.findMany({
      where: { visibility: { not: "PRIVATE" }, status: "PUBLISHED", deletedAt: null },
      include: contentInclude,
    });
    return contents.map(mapContent);
  }

  async listAll() {
    const contents = await prisma.content.findMany({ where: { deletedAt: null }, include: contentInclude, orderBy: { updatedAt: "desc" } });
    return contents.map(mapContent);
  }

  async findPublicBySlug(slug: string) {
    const content = await prisma.content.findFirst({
      where: { slug, visibility: { not: "PRIVATE" }, status: "PUBLISHED", deletedAt: null },
      include: contentInclude,
    });
    return content ? mapContent(content) : null;
  }

  async searchPublic(query: string) {
    const term = query.trim().toLocaleLowerCase("th");
    if (!term) return this.listPublic();
    const contents = await this.listPublic();
    return contents.filter((item) => [item.title, item.excerpt, item.category.name, ...item.tags, item.blocks.map(blockText).join(" ")].join(" ").toLocaleLowerCase("th").includes(term));
  }

  async listCategories() {
    const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return categories.map((category) => ({
      name: category.name,
      slug: category.slug,
      color: category.color ?? "#6d5dfc",
      icon: category.icon ?? "BookOpen",
    }));
  }
}

function mapContent(content: ContentRecord): KnowledgeContent {
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    excerpt: content.excerpt ?? "",
    type: mapContentType(content.contentType),
    status: mapStatus(content.status),
    visibility: content.visibility.toLowerCase() as KnowledgeContent["visibility"],
    category: content.category ? {
      name: content.category.name,
      slug: content.category.slug,
      color: content.category.color ?? "#6d5dfc",
      icon: content.category.icon ?? "BookOpen",
    } : { name: "ยังไม่จัดหมวด", slug: "uncategorized", color: "#71717f", icon: "BookOpen" },
    tags: content.tags.map(({ tag }) => tag.name),
    readingTime: content.readingTime,
    updatedAt: content.updatedAt.toISOString().slice(0, 10),
    publishedAt: content.publishedAt?.toISOString().slice(0, 10),
    featured: content.featured,
    blocks: parseStoredDocument(content.contentJson).readerBlocks,
  };
}

function mapStatus(status: ContentRecord["status"]): ContentStatus {
  if (status === "INBOX") return "inbox";
  if (status === "PUBLISHED") return "published";
  if (status === "ARCHIVED" || status === "DELETED") return "archived";
  return "draft";
}

function mapContentType(type: ContentRecord["contentType"]): ContentKind {
  if (type === "TUTORIAL") return "Tutorial";
  if (type === "CODE_SNIPPET") return "Code Snippet";
  if (type === "LEARNING_LOG") return "Learning Log";
  return "Knowledge Note";
}

function blockText(block: KnowledgeContent["blocks"][number]): string {
  if (block.type === "list") return block.items.join(" ");
  if (block.type === "code") return block.code;
  if (block.type === "callout" || block.type === "toggle") return `${block.title} ${block.text}`;
  return block.text;
}

export const contentRepository: ContentRepository = new PrismaContentRepository();
