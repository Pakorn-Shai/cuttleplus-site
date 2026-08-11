import { NextResponse } from "next/server";
import { z } from "zod";
import { contentRepository } from "@/core/content/repository";

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
  sort: z.enum(["relevance", "updated"]).default("relevance"),
  type: z.string().trim().max(50).optional(),
  category: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    sort: url.searchParams.get("sort") ?? "relevance",
    type: url.searchParams.get("type") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  const { q, ...options } = parsed.data;
  const results = await contentRepository.searchPublic(q, options);
  return NextResponse.json({ query: q, count: results.length, results: results.map((content) => ({ id: content.id, title: content.title, slug: content.slug, excerpt: content.excerpt, type: content.type, category: content.category, tags: content.tags, readingTime: content.readingTime, updatedAt: content.updatedAt, matchSnippet: content.matchSnippet })) });
}
