import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { blocksPlainText, buildContentArtifacts, parseStoredDocument } from "./document";
import type { CategorySummary, CollectionDetail, CollectionSummary, ContentKind, ContentStatus, KnowledgeContent, RelatedContentSummary, SeriesDetail, SeriesNavigation, SourceSummary, SeriesSummary, TagSummary } from "./types";

export type SearchSort = "relevance" | "updated";

export interface SearchOptions {
  sort?: SearchSort;
  type?: string;
  category?: string;
  tag?: string;
}

export interface SearchResult extends KnowledgeContent {
  matchSnippet?: string;
}

export interface ContentRepository {
  listPublic(): Promise<KnowledgeContent[]>;
  listPublishedRoutes(): Promise<KnowledgeContent[]>;
  listAll(): Promise<KnowledgeContent[]>;
  findById(id: string): Promise<KnowledgeContent | null>;
  findPublicBySlug(slug: string): Promise<KnowledgeContent | null>;
  searchPublic(query: string, options?: SearchOptions): Promise<SearchResult[]>;
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
  findSiblingsBySlug(slug: string): Promise<{ previous?: { title: string; slug: string }; next?: { title: string; slug: string } }>;
  findRelatedTags(currentTagSlug: string): Promise<TagSummary[]>;
}

const contentInclude = {
  category: true,
  tags: { include: { tag: true } },
  sources: true,
  outgoingRelations: { include: { targetContent: { select: { id: true, title: true, slug: true } } } },
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

  async searchPublic(query: string, options?: SearchOptions) {
    const term = query.trim().toLocaleLowerCase("th");
    const sort = options?.sort ?? "relevance";
    let contents = await this.listPublic();

    // Apply type/category/tag filters
    if (options?.type) contents = contents.filter((c) => c.type === options.type);
    if (options?.category) contents = contents.filter((c) => c.category.slug === options.category);
    if (options?.tag) contents = contents.filter((c) => c.tags.includes(options.tag!));

    if (!term) return sort === "updated" ? contents : contents;

    // Build search tokens for flexible matching (prefix-aware)
    const searchTokens = term.split(/\s+/).filter(Boolean);

    /** Check if a token matches text: exact, prefix, or 1-char-off (basic typo tolerance) */
    function tokenMatch(token: string, text: string): boolean {
      if (text.includes(token)) return true;
      // Prefix match: "sq" matches "sql"
      if (token.length >= 2) {
        const words = text.split(/[\s,;.!?()[\]{}\-_/]+/);
        if (words.some((w) => w.startsWith(token))) return true;
        // Basic typo tolerance: allow 1 character difference for tokens >= 3 chars
        if (token.length >= 3) {
          for (const word of words) {
            if (word.length >= 3 && Math.abs(word.length - token.length) <= 1) {
              let diffs = 0;
              const maxLen = Math.max(word.length, token.length);
              for (let i = 0; i < maxLen && diffs <= 1; i++) {
                if (word[i] !== token[i]) diffs++;
              }
              if (diffs <= 1) return true;
            }
          }
        }
      }
      return false;
    }

    const scored = contents.map((item) => {
      const titleLower = item.title.toLocaleLowerCase("th");
      const excerptLower = item.excerpt.toLocaleLowerCase("th");
      const categoryLower = item.category.name.toLocaleLowerCase("th");
      const tagsLower = item.tags.map((t) => t.toLocaleLowerCase("th")).join(" ");
      const bodyText = item.blocks.map(blockText).join(" ").toLocaleLowerCase("th");
      const sourcesText = (item.sources ?? []).map((s) => [s.title, s.author, s.publisher].filter(Boolean).join(" ")).join(" ").toLocaleLowerCase("th");
      const relationsText = (item.relatedContent ?? []).map((r) => r.title).join(" ").toLocaleLowerCase("th");
      const combinedText = [titleLower, excerptLower, categoryLower, tagsLower, bodyText, sourcesText, relationsText].join(" ");

      // Check all search tokens match (AND logic, with fuzzy/prefix fallback)
      const allMatch = searchTokens.every((token) => tokenMatch(token, combinedText));
      if (!allMatch) return { item, score: -1, snippet: "" };

      // Score: exact match > prefix > fuzzy; title > excerpt > tag > body
      let score = 0;
      for (const t of searchTokens) {
        if (titleLower.includes(t)) score += 100;
        else if (searchTokens.some((tk) => titleLower.startsWith(tk))) score += 80;
        else if (tokenMatch(t, titleLower)) score += 40;
        if (excerptLower.includes(t)) score += 50;
        if (tagsLower.includes(t)) score += 30;
        if (categoryLower.includes(t)) score += 20;
        if (sourcesText.includes(t)) score += 10;
      }
      // Exact title match bonus
      if (titleLower === term || searchTokens.some((t) => titleLower.startsWith(t))) score += 80;
      // Featured bonus
      if (item.featured) score += 5;

      // Generate match snippet from the first matching region
      const snippet = generateSnippet(excerptLower || bodyText, searchTokens);

      return { item, score, snippet };
    });

    const matched = scored.filter((r) => r.score >= 0);

    if (sort === "updated") {
      return matched
        .sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt))
        .map((r) => ({ ...r.item, matchSnippet: r.snippet || undefined }));
    }

    return matched
      .sort((a, b) => b.score - a.score || b.item.updatedAt.localeCompare(a.item.updatedAt))
      .map((r) => ({ ...r.item, matchSnippet: r.snippet || undefined }));
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
        coverUrl: true,
        _count: { select: { items: { where: { content: publicContentWhere } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return series.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      coverUrl: (item as { coverUrl?: string | null }).coverUrl ?? undefined,
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
      coverUrl: series.coverUrl ?? undefined,
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

  async findSiblingsBySlug(slug: string) {
    const content = await prisma.content.findFirst({
      where: { slug, ...publicContentWhere },
      select: { id: true, categoryId: true, publishedAt: true },
    });
    if (!content) return {};

    // Find previous/next in the same category by publishedAt
    const categoryFilter = { ...publicContentWhere, categoryId: content.categoryId ?? undefined };
    const [previous, next] = await Promise.all([
      prisma.content.findFirst({
        where: { ...categoryFilter, publishedAt: content.publishedAt ? { lt: content.publishedAt } : undefined, id: { not: content.id } },
        orderBy: { publishedAt: "desc" },
        select: { title: true, slug: true },
      }),
      prisma.content.findFirst({
        where: { ...categoryFilter, publishedAt: content.publishedAt ? { gt: content.publishedAt } : undefined, id: { not: content.id } },
        orderBy: { publishedAt: "asc" },
        select: { title: true, slug: true },
      }),
    ]);
    return { previous: previous ?? undefined, next: next ?? undefined };
  }

  async findRelatedTags(currentTagSlug: string) {
    // Find tags that co-occur on the same public content
    const taggedContent = await prisma.content.findMany({
      where: { ...publicContentWhere, tags: { some: { tag: { slug: currentTagSlug } } } },
      select: { id: true },
    });
    if (!taggedContent.length) return [];
    const contentIds = taggedContent.map((c) => c.id);
    const relatedTags = await prisma.tag.findMany({
      where: {
        slug: { not: currentTagSlug },
        contents: { some: { content: { id: { in: contentIds }, ...publicContentWhere } } },
      },
      select: {
        name: true, slug: true, description: true,
        _count: { select: { contents: { where: { content: publicContentWhere } } } },
      },
      orderBy: { name: "asc" },
      take: 20,
    });
    return relatedTags.map((t) => ({
      name: t.name, slug: t.slug, description: t.description ?? "", contentCount: t._count.contents,
    }));
  }
}

function generateSnippet(text: string, tokens: string[]): string {
  for (const token of tokens) {
    const idx = text.indexOf(token);
    if (idx >= 0) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + token.length + 60);
      const prefix = start > 0 ? "…" : "";
      const suffix = end < text.length ? "…" : "";
      return prefix + text.slice(start, end) + suffix;
    }
  }
  return text.slice(0, 120);
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
    sources: mapSources((content as ContentRecord & { sources: { id: string; url: string; title: string | null; author: string | null; publisher: string | null; publishedAt: Date | null; accessedAt: Date | null; sourceType: string | null; note: string | null; verified: boolean }[] }).sources ?? []),
    relatedContent: mapRelations((content as ContentRecord & { outgoingRelations: { relationType: string; targetContent: { id: string; title: string; slug: string } }[] }).outgoingRelations ?? []),
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

function mapSources(sources: { id: string; url: string; title: string | null; author: string | null; publisher: string | null; publishedAt: Date | null; accessedAt: Date | null; sourceType: string | null; note: string | null; verified: boolean }[]): SourceSummary[] {
  return sources.map((s) => ({
    id: s.id,
    url: s.url,
    title: s.title,
    author: s.author,
    publisher: s.publisher,
    publishedAt: s.publishedAt?.toISOString() ?? null,
    accessedAt: s.accessedAt?.toISOString() ?? null,
    sourceType: s.sourceType,
    note: s.note,
    verified: s.verified,
  }));
}

function mapRelations(relations: { relationType: string; targetContent: { id: string; title: string; slug: string } }[]): RelatedContentSummary[] {
  return relations.map((r) => ({
    id: r.targetContent.id,
    title: r.targetContent.title,
    slug: r.targetContent.slug,
    relationType: r.relationType.toLowerCase(),
  }));
}

export const contentRepository: ContentRepository = new PrismaContentRepository();
