import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { blocksPlainText, buildContentArtifacts, parseStoredDocument } from "./document";
import type { CategorySummary, CollectionDetail, CollectionSummary, ContentKind, ContentStatus, KnowledgeContent, SeriesDetail, SeriesNavigation, SeriesSummary, TagSummary } from "./types";

export interface ContentRepository {
  listPublic(): Promise<KnowledgeContent[]>;
  listPublishedRoutes(): Promise<KnowledgeContent[]>;
  listAll(): Promise<KnowledgeContent[]>;
  findById(id: string): Promise<KnowledgeContent | null>;
  findPublicBySlug(slug: string): Promise<KnowledgeContent | null>;
  searchPublic(query: string): Promise<KnowledgeContent[]>;
  listCategories(): Promise<CategorySummary[]>;
  listPublicTags(): Promise<TagSummary[]>;
  findPublicTagBySlug(slug: string): Promise<TagSummary | null>;
  listPublicByTag(slug: string): Promise<KnowledgeContent[]>;
  listPublicSeries(): Promise<SeriesSummary[]>;
  findOpenSeriesBySlug(slug: string): Promise<SeriesDetail | null>;
  findPublicSeriesNavigation(contentId: string): Promise<SeriesNavigation | null>;
  listPublicCollections(): Promise<CollectionSummary[]>;
  findOpenCollectionBySlug(slug: string): Promise<CollectionDetail | null>;
  findSlugRedirect(slug: string): Promise<{ targetPath: string; statusCode: number } | null>;
}

const contentInclude = {
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ContentInclude;

const publicContentWhere = {
  visibility: "PUBLIC",
  status: "PUBLISHED",
  deletedAt: null,
} satisfies Prisma.ContentWhereInput;

type ContentRecord = Prisma.ContentGetPayload<{ include: typeof contentInclude }>;

class PrismaContentRepository implements ContentRepository {
  async listPublic() {
    const contents = await prisma.content.findMany({
      where: publicContentWhere,
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

  async findById(id: string) {
    const content = await prisma.content.findFirst({ where: { id, deletedAt: null }, include: contentInclude });
    return content ? mapContent(content) : null;
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

  async listPublicTags() {
    const tags = await prisma.tag.findMany({
      where: { contents: { some: { content: publicContentWhere } } },
      select: {
        name: true,
        slug: true,
        description: true,
        _count: { select: { contents: { where: { content: publicContentWhere } } } },
      },
      orderBy: { name: "asc" },
    });
    return tags.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? "",
      contentCount: tag._count.contents,
    }));
  }

  async findPublicTagBySlug(slug: string) {
    const tag = await prisma.tag.findFirst({
      where: { slug, contents: { some: { content: publicContentWhere } } },
      select: {
        name: true,
        slug: true,
        description: true,
        _count: { select: { contents: { where: { content: publicContentWhere } } } },
      },
    });
    return tag ? {
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? "",
      contentCount: tag._count.contents,
    } : null;
  }

  async listPublicByTag(slug: string) {
    const contents = await prisma.content.findMany({
      where: { ...publicContentWhere, tags: { some: { tag: { slug } } } },
      include: contentInclude,
      orderBy: { updatedAt: "desc" },
    });
    return contents.map(mapContent);
  }

  async listPublicSeries() {
    const series = await prisma.series.findMany({
      where: { visibility: "PUBLIC", items: { some: { content: publicContentWhere } } },
      select: {
        name: true,
        slug: true,
        description: true,
        _count: { select: { items: { where: { content: publicContentWhere } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return series.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      contentCount: item._count.items,
    }));
  }

  async findOpenSeriesBySlug(slug: string) {
    const series = await prisma.series.findFirst({
      where: { slug, visibility: { not: "PRIVATE" } },
      include: {
        items: {
          include: { content: { include: contentInclude } },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!series) return null;
    const items = series.items
      .filter(({ content }) => content.status === "PUBLISHED"
        && !content.deletedAt
        && (series.visibility === "PUBLIC" ? content.visibility === "PUBLIC" : content.visibility !== "PRIVATE"))
      .map(({ content }) => mapContent(content));
    if (!items.length) return null;
    return {
      name: series.name,
      slug: series.slug,
      description: series.description ?? "",
      contentCount: items.length,
      visibility: series.visibility.toLowerCase() as SeriesDetail["visibility"],
      items,
    };
  }

  async findPublicSeriesNavigation(contentId: string) {
    const membership = await prisma.seriesItem.findFirst({
      where: { contentId, series: { visibility: "PUBLIC" } },
      include: {
        series: {
          include: {
            items: {
              where: { content: publicContentWhere },
              include: { content: { select: { title: true, slug: true } } },
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: { series: { updatedAt: "desc" } },
    });
    if (!membership) return null;
    const index = membership.series.items.findIndex((item) => item.contentId === contentId);
    if (index < 0) return null;
    const previous = membership.series.items[index - 1]?.content;
    const next = membership.series.items[index + 1]?.content;
    return {
      name: membership.series.name,
      slug: membership.series.slug,
      position: index + 1,
      total: membership.series.items.length,
      previous,
      next,
    };
  }

  async listPublicCollections() {
    const collections = await prisma.collection.findMany({
      where: { visibility: "PUBLIC", items: { some: { content: publicContentWhere } } },
      select: {
        name: true,
        slug: true,
        description: true,
        _count: { select: { items: { where: { content: publicContentWhere } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return collections.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      contentCount: item._count.items,
    }));
  }

  async findOpenCollectionBySlug(slug: string) {
    const collection = await prisma.collection.findFirst({
      where: { slug, visibility: { not: "PRIVATE" } },
      include: {
        items: {
          include: { content: { include: contentInclude } },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!collection) return null;
    const items = collection.items
      .filter(({ content }) => content.status === "PUBLISHED"
        && !content.deletedAt
        && (collection.visibility === "PUBLIC" ? content.visibility === "PUBLIC" : content.visibility !== "PRIVATE"))
      .map(({ content, note }) => ({ content: mapContent(content), note: note ?? "" }));
    if (!items.length) return null;
    return {
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? "",
      contentCount: items.length,
      visibility: collection.visibility.toLowerCase() as CollectionDetail["visibility"],
      items,
    };
  }

  async findSlugRedirect(slug: string) {
    return prisma.slugRedirect.findUnique({ where: { sourcePath: `/knowledge/${slug}` }, select: { targetPath: true, statusCode: true } });
  }
}

function mapContent(content: ContentRecord): KnowledgeContent {
  const artifacts = buildContentArtifacts(parseStoredDocument(content.contentJson).readerBlocks);
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
    scheduledAt: content.scheduledAt?.toISOString() ?? undefined,
    featured: content.featured,
    blocks: artifacts.blocks,
    headings: artifacts.headings,
  };
}

function mapStatus(status: ContentRecord["status"]): ContentStatus {
  if (status === "INBOX") return "inbox";
  if (status === "SCHEDULED") return "scheduled";
  if (status === "PUBLISHED") return "published";
  if (status === "ARCHIVED" || status === "DELETED") return "archived";
  return "draft";
}

function mapContentType(type: ContentRecord["contentType"]): ContentKind {
  const labels: Record<ContentRecord["contentType"], ContentKind> = {
    QUICK_NOTE: "Quick Note",
    KNOWLEDGE_NOTE: "Knowledge Note",
    TUTORIAL: "Tutorial",
    ARTICLE: "Article",
    CODE_SNIPPET: "Code Snippet",
    TROUBLESHOOTING: "Troubleshooting",
    CHEAT_SHEET: "Cheat Sheet",
    REFERENCE: "Reference",
    LEARNING_LOG: "Learning Log",
    PROJECT_NOTE: "Project Note",
    CASE_STUDY: "Case Study",
    CHECKLIST: "Checklist",
  };
  return labels[type];
}

function blockText(block: KnowledgeContent["blocks"][number]): string {
  return blocksPlainText([block]);
}

export const contentRepository: ContentRepository = new PrismaContentRepository();
