import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "@/core/content/document";
import { getTemplateVersion, getTemplate } from "./prompt-templates";
import { checkBudget } from "./budget";
import { estimateCost } from "./cost";
import { getProvider } from "./provider";
import { metadataResponseSchema } from "./openrouter";

export interface LearningPathSuggestion {
  summary: string;
  suggestedCategory: string | null;
  suggestedTags: string[];
  suggestedSeries: string | null;
  suggestedRelations: { title: string; reason: string }[];
  suggestedInternalLinks: { anchorText: string; targetDescription: string; reason: string }[];
  suggestedContentType: string | null;
  suggestedSlug: string | null;
  suggestedMetaDescription: string | null;
  suggestedAltTexts: { blockId: string; altText: string }[];
}

export interface LearningSummary {
  period: string;
  totalContent: number;
  categories: string[];
  topTags: string[];
  summary: string;
  suggestedNextTopics: string[];
}

/**
 * Generate a learning summary for content created/updated in a given period.
 * Uses AI to analyze patterns and suggest next topics.
 */
export async function generateLearningSummary(months = 1): Promise<LearningSummary> {
  await checkBudget();

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const contents = await prisma.content.findMany({
    where: { updatedAt: { gte: since }, deletedAt: null },
    include: { category: { select: { name: true } }, tags: { include: { tag: { select: { name: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  if (contents.length === 0) {
    return {
      period: `Last ${months} month(s)`,
      totalContent: 0,
      categories: [],
      topTags: [],
      summary: "No content was created or updated in this period.",
      suggestedNextTopics: [],
    };
  }

  // Collect categories and tags
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const titles: string[] = [];

  for (const content of contents) {
    titles.push(content.title);
    const catName = content.category?.name || "Uncategorized";
    categoryCounts.set(catName, (categoryCounts.get(catName) ?? 0) + 1);
    for (const { tag } of content.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }
  }

  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  // Use AI to generate summary and suggestions
  let aiSummary = "";
  let suggestedNextTopics: string[] = [];

  try {
    const provider = getProvider();
    const template = getTemplate("taxonomy");
    const model = process.env.OPTIMIZER_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

    const job = await prisma.aIJob.create({
      data: {
        jobType: "LEARNING_SUMMARY",
        provider: "openrouter",
        model,
        promptVersion: getTemplateVersion("taxonomy"),
        inputHash: `learning-summary-${since.toISOString().slice(0, 10)}`,
        status: "RUNNING",
      },
    });

    const result = await provider.requestMetadataSuggestion({
      title: `Learning Summary: ${since.toISOString().slice(0, 10)} to ${new Date().toISOString().slice(0, 10)}`,
      excerpt: `Content created/updated: ${titles.join(", ")}`,
      blocks: [],
      availableCategories: topCategories,
      existingTags: topTags,
      maxTokens: 1024,
      systemPrompt: [
        "You are a learning coach analyzing a knowledge base.",
        "Summarize what topics the owner has been learning about recently.",
        "Suggest 3-5 next topics they might want to explore based on patterns.",
        "Return only the required structured JSON result.",
      ].join(" "),
      responseSchema: metadataResponseSchema,
    });

    aiSummary = result.suggestion.summary;
    suggestedNextTopics = result.suggestion.suggestedTags.slice(0, 5);

    const cost = estimateCost(result.inputTokens ?? 0, result.outputTokens ?? 0);
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, estimatedCost: cost, completedAt: new Date() },
    });
  } catch (error) {
    // AI failed — use basic summary
    aiSummary = `You worked on ${contents.length} pieces of content across ${topCategories.length} categories. Main topics: ${topTags.slice(0, 5).join(", ")}.`;
    suggestedNextTopics = topTags.slice(0, 5);
  }

  return {
    period: `${since.toISOString().slice(0, 10)} to ${new Date().toISOString().slice(0, 10)}`,
    totalContent: contents.length,
    categories: topCategories,
    topTags,
    summary: aiSummary,
    suggestedNextTopics,
  };
}

/**
 * Suggest learning paths based on content relations and taxonomy.
 * Analyzes existing series, prerequisites, and follow-up relations.
 */
export async function suggestLearningPaths(): Promise<{
  existingSeries: { name: string; slug: string; progress: number; totalItems: number }[];
  suggestedPaths: { title: string; description: string; topics: string[] }[];
}> {
  const series = await prisma.series.findMany({
    where: { visibility: { in: ["PUBLIC", "UNLISTED"] } },
    include: { items: { include: { content: { select: { title: true, slug: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  const existingSeries = series.map((s) => ({
    name: s.name,
    slug: s.slug,
    progress: 0, // No multi-user progress tracking
    totalItems: s.items.length,
  }));

  // Generate suggested paths from content relations
  const relations = await prisma.contentRelation.findMany({
    where: { relationType: { in: ["PREREQUISITE", "FOLLOW_UP"] } },
    include: {
      sourceContent: { select: { title: true, slug: true, category: { select: { name: true } } } },
      targetContent: { select: { title: true, slug: true, category: { select: { name: true } } } },
    },
    take: 50,
  });

  // Group relations into suggested paths
  const pathMap = new Map<string, { title: string; description: string; topics: Set<string> }>();

  for (const rel of relations) {
    const catName = rel.sourceContent.category?.name || "General";
    if (!pathMap.has(catName)) {
      pathMap.set(catName, { title: `Learning Path: ${catName}`, description: `Suggested learning sequence for ${catName}`, topics: new Set() });
    }
    const path = pathMap.get(catName)!;
    path.topics.add(rel.sourceContent.title);
    path.topics.add(rel.targetContent.title);
  }

  const suggestedPaths = [...pathMap.values()].map((p) => ({
    ...p,
    topics: [...p.topics].slice(0, 10),
  }));

  return { existingSeries, suggestedPaths };
}