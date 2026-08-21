import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { contentSnapshotHash } from "./content-hash";
import { parseStoredDocument } from "@/core/content/document";
import { getTemplateVersion, getTemplate } from "./prompt-templates";
import { checkBudget } from "./budget";
import { estimateCost } from "./cost";
import { getProvider } from "./provider";
import { metadataResponseSchema } from "./openrouter";
import { getTyphoonModel } from "./typhoon";

export async function createTaxonomySuggestion(contentId: string) {
  await checkBudget();
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { category: true, tags: { include: { tag: true } } },
  });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");

  const inputHash = contentSnapshotHash(content);
  const duplicate = await prisma.aISuggestion.findFirst({
    where: { contentId, status: "PENDING", suggestionType: "TAXONOMY" },
  });
  if (duplicate) return duplicate;

  const categories = await prisma.category.findMany({ select: { name: true }, orderBy: { sortOrder: "asc" } });
  const availableCategories = categories.map((c) => c.name);
  const existingTags = content.tags.map(({ tag }) => tag.name);
  const existingSeries = await prisma.series.findMany({ select: { name: true } });
  const availableSeries = existingSeries.map((s) => s.name);

  const stored = parseStoredDocument(content.contentJson);
  const template = getTemplate("taxonomy");
  const model = getTyphoonModel();

  const job = await prisma.aIJob.create({
    data: {
      contentId,
      jobType: "TAXONOMY",
      provider: "typhoon",
      model,
      promptVersion: getTemplateVersion("taxonomy"),
      inputHash,
      status: "RUNNING",
    },
  });

  try {
    const maxTokens = 2048;
    const systemPrompt = template.systemPrompt;
    const userContent = JSON.stringify({
      title: content.title,
      excerpt: content.excerpt ?? "",
      blocks: stored.readerBlocks,
      availableCategories,
      existingTags,
      availableSeries,
    });

    // Use the metadata suggestion schema since it already has the right shape.
    const provider = getProvider("typhoon");
    const result = await provider.requestMetadataSuggestion({
        title: content.title,
        excerpt: content.excerpt ?? "",
        blocks: stored.readerBlocks,
        availableCategories,
        existingTags,
        maxTokens,
        systemPrompt,
        responseSchema: metadataResponseSchema,
      });

    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.aISuggestion.create({
        data: {
          contentId,
          jobId: job.id,
          suggestionType: "TAXONOMY",
          originalJson: {
            title: content.title,
            excerpt: content.excerpt ?? "",
            category: content.category?.name ?? null,
            tags: existingTags,
          },
          suggestedJson: result.suggestion as unknown as Prisma.InputJsonValue,
        },
      });
      const cost = estimateCost(result.inputTokens ?? 0, result.outputTokens ?? 0);
      await tx.aIJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          provider: "typhoon",
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: cost,
          completedAt: new Date(),
        },
      });
      return suggestion;
    });
  } catch (error) {
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "Unknown provider error",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}