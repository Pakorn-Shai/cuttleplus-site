import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { buildContentArtifacts, createStoredDocument, parseStoredDocument, readerBlocksToEditorBlocks } from "@/core/content/document";
import { prisma } from "@/lib/prisma";
import { getOpenRouterModel, requestAISuggestion, type AIRequestOptions } from "./openrouter";
import { contentSnapshotHash, legacyContentSnapshotHash, matchesOriginalSuggestionSnapshot } from "./content-hash";
import { applyReadabilitySuggestion, readabilitySuggestionSchema } from "./suggestion";
import { getTemplateVersion } from "./prompt-templates";
import { checkBudget, trackUsage } from "./budget";
import { estimateCost } from "./cost";

export async function createReadabilitySuggestion(contentId: string, options?: AIRequestOptions) {
  await checkBudget();
  const content = await prisma.content.findUnique({ where: { id: contentId }, include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } } });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");
  const inputHash = contentSnapshotHash(content);
  const duplicate = await prisma.aISuggestion.findFirst({ where: { contentId, status: "PENDING", job: { inputHash, jobType: "READABILITY" } }, include: { job: true } });
  if (duplicate) return duplicate;
  const model = getOpenRouterModel();
  const job = await prisma.aIJob.create({ data: { contentId, jobType: "READABILITY", provider: "openrouter", model, promptVersion: getTemplateVersion("readability"), inputHash, status: "RUNNING" } });
  const stored = parseStoredDocument(content.contentJson);
  try {
    const result = await requestAISuggestion({ title: content.title, excerpt: content.excerpt ?? "", blocks: stored.readerBlocks }, options);
    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.aISuggestion.create({ data: {
        contentId, revisionId: content.revisions[0]?.id, jobId: job.id, suggestionType: "READABILITY",
        originalJson: { title: content.title, excerpt: content.excerpt ?? "", blocks: stored.readerBlocks } as unknown as Prisma.InputJsonValue,
        suggestedJson: result.suggestion as unknown as Prisma.InputJsonValue,
      } });
      const cost = estimateCost(result.inputTokens ?? 0, result.outputTokens ?? 0);
      await tx.aIJob.update({ where: { id: job.id }, data: { status: "COMPLETED", model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, estimatedCost: cost, completedAt: new Date() } });
      return suggestion;
    });
  } catch (error) {
    await prisma.aIJob.update({ where: { id: job.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "Unknown provider error", completedAt: new Date() } });
    throw error;
  }
}

export async function reviewSuggestion(input: { suggestionId: string; decision: "accept" | "reject"; userId: string; blockIds?: string[] }) {
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
    const isPartial = input.blockIds && input.blockIds.length > 0;
    const blocks = applyReadabilitySuggestion(stored.readerBlocks, proposed.data, isPartial ? { blockIds: input.blockIds } : undefined);
    const artifacts = buildContentArtifacts(blocks);
    const document = createStoredDocument(artifacts.blocks, readerBlocksToEditorBlocks(artifacts.blocks.filter((block) => block.type !== "executable-code" && block.type !== "formula-example" && block.type !== "automation-script"))) as unknown as Prisma.InputJsonValue;
    const latest = await tx.contentRevision.aggregate({ where: { contentId: suggestion.contentId }, _max: { revisionNumber: true } });
    // Preserve the exact state that is about to be replaced. Creating the
    // revision first also makes an accepted suggestion reversible even when
    // this is the content's first revision.
    const reason = isPartial
      ? `Before accepting AI suggestion ${suggestion.id} (partial: ${input.blockIds!.length} blocks)`
      : `Before accepting AI suggestion ${suggestion.id}`;
    const previousRevision = await tx.contentRevision.create({ data: {
      contentId: suggestion.content.id,
      revisionNumber: (latest._max.revisionNumber ?? 0) + 1,
      title: suggestion.content.title,
      excerpt: suggestion.content.excerpt,
      contentJson: suggestion.content.contentJson as Prisma.InputJsonValue,
      contentHtml: suggestion.content.contentHtml,
      plainText: suggestion.content.plainText,
      createdById: input.userId,
      source: "AI",
      reason,
    } });

    // Avoid overwriting an autosave that lands after the snapshot check. A
    // concurrent edit changes updatedAt, so this write fails and rolls back
    // the pre-change revision together with the rest of the transaction.
    const updated = await tx.content.updateMany({
      where: { id: suggestion.contentId, updatedAt: suggestion.content.updatedAt },
      data: {
        title: proposed.data.title,
        excerpt: proposed.data.excerpt,
        contentJson: document,
        contentHtml: artifacts.html,
        plainText: artifacts.plainText,
        readingTime: Math.max(1, Math.ceil(artifacts.plainText.split(/\s+/u).filter(Boolean).length / 200)),
      },
    });
    if (updated.count !== 1) throw new Error("CONTENT_CHANGED");
    const content = await tx.content.findUniqueOrThrow({ where: { id: suggestion.contentId } });

    await tx.aISuggestion.update({
      where: { id: suggestion.id },
      data: { status: "ACCEPTED", reviewedAt: new Date(), revisionId: previousRevision.id },
    });
    const auditAction = isPartial ? "AI_SUGGESTION_PARTIAL_ACCEPTED" : "AI_SUGGESTION_ACCEPTED";
    await tx.auditLog.create({ data: { userId: input.userId, action: auditAction, entityType: "AISuggestion", entityId: suggestion.id } });
    return { contentId: content.id, slug: content.slug };
  });
}
