import { NextResponse } from "next/server";
import { z } from "zod";
import { contentRepository } from "@/core/content/repository";

const searchSchema = z.object({ q: z.string().trim().max(100).default("") });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid search query" }, { status: 400 });
  const results = await contentRepository.searchPublic(parsed.data.q);
  return NextResponse.json({ query: parsed.data.q, count: results.length, results: results.map((content) => ({ id: content.id, title: content.title, slug: content.slug, excerpt: content.excerpt, type: content.type, category: content.category, tags: content.tags, readingTime: content.readingTime, updatedAt: content.updatedAt })) });
}
