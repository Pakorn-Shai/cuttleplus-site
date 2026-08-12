import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "@/core/content/document";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding vector for text using OpenRouter's embedding-compatible endpoint.
 * Falls back to a simple TF-based approach if the API is not available.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return simpleEmbedding(text);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return simpleEmbedding(text);

    const payload = (await response.json()) as { data?: { embedding: number[] }[] };
    return payload.data?.[0]?.embedding || simpleEmbedding(text);
  } catch {
    return simpleEmbedding(text);
  }
}

/**
 * Simple TF-IDF-like embedding for fallback when API is unavailable.
 * Uses character n-grams to create a sparse vector representation.
 */
function simpleEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter(Boolean);

  // Create a bag-of-words vector using word hashes
  const vector = new Array(256).fill(0);
  for (const word of words) {
    const hash = simpleHash(word) % 256;
    vector[hash] += 1;
  }

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    // Pad the shorter vector
    const maxLen = Math.max(a.length, b.length);
    const paddedA = [...a, ...new Array(maxLen - a.length).fill(0)];
    const paddedB = [...b, ...new Array(maxLen - b.length).fill(0)];
    return cosineSimilarity(paddedA, paddedB);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Create or update embedding for a content item.
 */
export async function embedContent(contentId: string): Promise<void> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.deletedAt) return;

  const stored = parseStoredDocument(content.contentJson);
  const text = `${content.title}\n${content.excerpt ?? ""}\n${stored.readerBlocks.map((b) => {
    if ("text" in b && typeof b.text === "string") return b.text;
    if ("code" in b && typeof b.code === "string") return b.code;
    if ("items" in b && Array.isArray(b.items)) return b.items.join(" ");
    return "";
  }).join("\n")}`;

  const embedding = await generateEmbedding(text);

  await prisma.contentEmbedding.upsert({
    where: { contentId },
    update: { embedding, model: EMBEDDING_MODEL },
    create: { contentId, embedding, model: EMBEDDING_MODEL },
  });
}

/**
 * Search content by semantic similarity.
 * Returns content IDs sorted by relevance.
 */
export async function semanticSearch(query: string, limit = 20): Promise<{ contentId: string; score: number }[]> {
  const queryEmbedding = await generateEmbedding(query);

  const embeddings = await prisma.contentEmbedding.findMany();

  // Filter to only published public content
  const publishedIds = new Set(
    (await prisma.content.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC", deletedAt: null },
      select: { id: true },
    })).map((c) => c.id),
  );

  const results = embeddings
    .filter((e) => publishedIds.has(e.contentId))
    .map((e) => {
      const storedEmbedding = e.embedding as number[];
      const score = cosineSimilarity(queryEmbedding, storedEmbedding);
      return { contentId: e.contentId, score };
    })
    .filter((r) => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}