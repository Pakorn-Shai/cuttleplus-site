import { NextResponse } from "next/server";
import { z } from "zod";
import { contentRepository } from "@/core/content/repository";
import { semanticSearch } from "@/core/search/embeddings";

const searchSchema = z.object({
  q: z.string().trim().max(200).default(""),
  sort: z.enum(["relevance", "updated"]).default("relevance"),
  type: z.string().trim().max(50).optional(),
  category: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(100).optional(),
  semantic: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    sort: url.searchParams.get("sort") ?? "relevance",
    type: url.searchParams.get("type") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    semantic: url.searchParams.get("semantic") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  const { q, semantic: useSemantic, ...options } = parsed.data;

  // Try semantic search first if requested
  if (useSemantic === "true" && q) {
    try {
      const semanticResults = await semanticSearch(q, 20);
      if (semanticResults.length > 0) {
        const allContent = await contentRepository.listPublic();
        const idSet = new Set(semanticResults.map((r) => r.contentId));
        const matched = allContent.filter((c) => idSet.has(c.id));
        return NextResponse.json({
          query: q,
          count: matched.length,
          semantic: true,
          results: matched.map((content) => ({
            id: content.id,
            title: content.title,
            slug: content.slug,
            excerpt: content.excerpt,
            type: content.type,
            category: content.category,
            tags: content.tags,
            readingTime: content.readingTime,
            updatedAt: content.updatedAt,
          })),
        });
      }
    } catch {
      // Fall back to regular search
    }
  }

  const results = await contentRepository.searchPublic(q, options);
  return NextResponse.json({ query: q, count: results.length, results: results.map((content) => ({ id: content.id, title: content.title, slug: content.slug, excerpt: content.excerpt, type: content.type, category: content.category, tags: content.tags, readingTime: content.readingTime, updatedAt: content.updatedAt, matchSnippet: content.matchSnippet })) });
}
