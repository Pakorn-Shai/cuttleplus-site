import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { buildContentArtifacts, createStoredDocument, parseStoredDocument, readerBlocksToEditorBlocks } from "@/core/content/document";
import { prisma } from "@/lib/prisma";
import { getOpenRouterModel, requestReadabilitySuggestion } from "./openrouter";
import { contentSnapshotHash, legacyContentSnapshotHash, matchesOriginalSuggestionSnapshot } from "./content-hash";
import { applyReadabilitySuggestion, readabilitySuggestionSchema } from "./suggestion";

const PROMPT_VERSION = "readability-v1";

export async function createReadabilitySuggestion(contentId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId }, include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } } });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");
  const inputHash = contentSnapshotHash(content);
  const duplicate = await prisma.aISuggestion.findFirst({ where: { contentId, status: "PENDING", job: { inputHash, jobType: "READABILITY" } }, include: { job: true } });
  if (duplicate) return duplicate;
  const model = getOpenRouterModel();
  const job = await prisma.aIJob.create({ data: { contentId, jobType: "READABILITY", provider: "openrouter", model, promptVersion: PROMPT_VERSION, inputHash, status: "RUNNING" } });
  const stored = parseStoredDocument(content.contentJson);
  try {
    const result = await requestReadabilitySuggestion({ title: content.title, excerpt: content.excerpt ?? "", blocks: stored.readerBlocks });
    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.aISuggestion.create({ data: {
        contentId, revisionId: content.revisions[0]?.id, jobId: job.id, suggestionType: "READABILITY",
        originalJson: { title: content.title, excerpt: content.excerpt ?? "", blocks: stored.readerBlocks } as unknown as Prisma.InputJsonValue,
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

export async function reviewSuggestion(input: { suggestionId: string; decision: "accept" | "reject"; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.aISuggestion.findUnique({
      where: { id: input.suggestionId },
      include: {
        content: { include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } } },
        job: true,
      },
    });
    if (!suggestion || suggestion.status !== "PENDING") throw new Error("SUGGESTION_NOT_FOUND");
    if (input.decision === "reject") {
      await tx.aISuggestion.update({ where: { id: suggestion.id }, data: { status: "REJECTED", reviewedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: input.userId, action: "AI_SUGGESTION_REJECTED", entityType: "AISuggestion", entityId: suggestion.id } });
      return { contentId: suggestion.contentId, slug: suggestion.content.slug };
    }
    const currentHash = contentSnapshotHash(suggestion.content);
    // Suggestions created before the canonical hash fix included the relation
    // loaded by createReadabilitySuggestion. Prefer its exact legacy hash, then
    // fall back to the persisted original reader snapshot for old jobs whose
    // metadata timestamp changed without any user-visible content changing.
    const legacyHash = legacyContentSnapshotHash(suggestion.content);
    const originalStillMatches = matchesOriginalSuggestionSnapshot(suggestion.content, suggestion.originalJson);
    if (currentHash !== suggestion.job.inputHash && legacyHash !== suggestion.job.inputHash && !originalStillMatches) throw new Error("CONTENT_CHANGED");
    const proposed = readabilitySuggestionSchema.safeParse(suggestion.suggestedJson);
    if (!proposed.success) throw new Error("INVALID_SUGGESTION");
    const stored = parseStoredDocument(suggestion.content.contentJson);
    const blocks = applyReadabilitySuggestion(stored.readerBlocks, proposed.data);
    const artifacts = buildContentArtifacts(blocks);
    const document = createStoredDocument(artifacts.blocks, readerBlocksToEditorBlocks(artifacts.blocks)) as unknown as Prisma.InputJsonValue;
    const latest = await tx.contentRevision.aggregate({ where: { contentId: suggestion.contentId }, _max: { revisionNumber: true } });
    const content = await tx.content.update({ where: { id: suggestion.contentId }, data: {
      title: proposed.data.title, excerpt: proposed.data.excerpt, contentJson: document, contentHtml: artifacts.html, plainText: artifacts.plainText,
      readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
    } });
    await tx.contentRevision.create({ data: {
      contentId: content.id, revisionNumber: (latest._max.revisionNumber ?? 0) + 1, title: content.title, excerpt: content.excerpt,
      contentJson: document, contentHtml: artifacts.html, plainText: artifacts.plainText, createdById: input.userId, source: "AI", reason: `Accepted AI suggestion ${suggestion.id}`,
    } });
    await tx.aISuggestion.update({ where: { id: suggestion.id }, data: { status: "ACCEPTED", reviewedAt: new Date() } });
    await tx.auditLog.create({ data: { userId: input.userId, action: "AI_SUGGESTION_ACCEPTED", entityType: "AISuggestion", entityId: suggestion.id } });
    return { contentId: content.id, slug: content.slug };
  });
}
