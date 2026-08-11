import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { contentSnapshotHash } from "./content-hash";
import { requestMetadataSuggestion } from "./openrouter";
import { parseStoredDocument } from "@/core/content/document";

export async function createMetadataSuggestion(contentId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId }, include: { category: true, tags: { include: { tag: true } } } });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");

  const inputHash = contentSnapshotHash(content);
  // Deduplicate: skip if there's a pending metadata job with same hash
  const duplicate = await prisma.aIJob.findFirst({ where: { contentId, jobType: "METADATA", inputHash, status: "COMPLETED" } });
  if (duplicate) {
    // Return the existing suggestion if still pending
    const existing = await prisma.aISuggestion.findFirst({ where: { contentId, suggestionType: "METADATA", status: "PENDING" }, orderBy: { createdAt: "desc" } });
    if (existing) return existing;
  }

  const categories = await prisma.category.findMany({ select: { name: true }, orderBy: { sortOrder: "asc" } });
  const availableCategories = categories.map((c) => c.name);

  const stored = parseStoredDocument(content.contentJson);
  const model = process.env.OPTIMIZER_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

  const job = await prisma.aIJob.create({ data: { contentId, jobType: "METADATA", provider: "openrouter", model, promptVersion: "metadata-v1", inputHash, status: "RUNNING" } });

  try {
    const result = await requestMetadataSuggestion({
      title: content.title,
      excerpt: content.excerpt ?? "",
      blocks: stored.readerBlocks,
      availableCategories,
      existingTags: content.tags.map(({ tag }) => tag.name),
    });

    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.aISuggestion.create({ data: {
        contentId, jobId: job.id, suggestionType: "METADATA",
        originalJson: { title: content.title, excerpt: content.excerpt ?? "", category: content.category?.name ?? null, tags: content.tags.map(({ tag }) => tag.name) },
        suggestedJson: result.suggestion as unknown as Prisma.InputJsonValue,
      } });
      await tx.aIJob.update({ where: { id: job.id }, data: { status: "COMPLETED", model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, completedAt: new Date() } });
      return suggestion;
    });
  } catch (error) {
    await prisma.aIJob.update({ where: { id: job.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "Unknown provider error", completedAt: new Date() } });
    throw error;
  }
}