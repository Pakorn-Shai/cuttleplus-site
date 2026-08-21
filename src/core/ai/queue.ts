import "server-only";

import { prisma } from "@/lib/prisma";
import { getTyphoonModel } from "./typhoon";
import { requestAISuggestion } from "./openrouter";
import { parseStoredDocument } from "@/core/content/document";
import { contentSnapshotHash } from "./content-hash";
import { getTemplateVersion } from "./prompt-templates";
import { checkBudget } from "./budget";
import { estimateCost } from "./cost";
import { Prisma } from "@/generated/prisma/client";

const MAX_CONCURRENT = 2;
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max per job

/**
 * Process pending AI jobs from the queue.
 * Safe to call multiple times — uses atomic status update to claim jobs.
 * Returns the number of jobs processed.
 */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  // Claim up to MAX_CONCURRENT queued jobs atomically
  const jobs = await prisma.aIJob.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: MAX_CONCURRENT,
  });

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    // Mark as RUNNING atomically — if another worker already claimed it, skip
    const claimed = await prisma.aIJob.updateMany({
      where: { id: job.id, status: "QUEUED" },
      data: { status: "RUNNING" },
    });
    if (claimed.count === 0) continue;

    try {
      await processJob(job.id);
      processed++;
    } catch {
      failed++;
      await prisma.aIJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: "Queue processing failed", completedAt: new Date() },
      });
    }
  }

  return { processed, failed };
}

async function processJob(jobId: string) {
  const job = await prisma.aIJob.findUnique({
    where: { id: jobId },
    include: { content: { include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } } } },
  });
  if (!job || !job.content) throw new Error("JOB_CONTENT_MISSING");

  const content = job.content;
  const stored = parseStoredDocument(content.contentJson);

  try {
    await checkBudget();

    if (job.jobType === "READABILITY") {
      const result = await requestAISuggestion({
        title: content.title,
        excerpt: content.excerpt ?? "",
        blocks: stored.readerBlocks,
      });

      await prisma.$transaction(async (tx) => {
        await tx.aISuggestion.create({
          data: {
            contentId: content.id,
            revisionId: content.revisions[0]?.id,
            jobId: job.id,
            suggestionType: "READABILITY",
            originalJson: { title: content.title, excerpt: content.excerpt ?? "", blocks: stored.readerBlocks } as unknown as Prisma.InputJsonValue,
            suggestedJson: result.suggestion as unknown as Prisma.InputJsonValue,
          },
        });
        const cost = estimateCost(result.inputTokens ?? 0, result.outputTokens ?? 0);
        await tx.aIJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            model: result.model,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCost: cost,
            completedAt: new Date(),
          },
        });
      });
    } else {
      // Other job types are processed synchronously via their dedicated endpoints
      await prisma.aIJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: `Unsupported job type for queue: ${job.jobType}`, completedAt: new Date() },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown error";
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
    });
    throw error;
  }
}

/**
 * Enqueue a readability suggestion job for background processing.
 * Returns the job ID immediately.
 */
export async function enqueueReadabilityJob(contentId: string): Promise<string> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");

  const inputHash = contentSnapshotHash(content);
  const duplicate = await prisma.aISuggestion.findFirst({
    where: { contentId, status: "PENDING", job: { inputHash, jobType: "READABILITY" } },
    include: { job: true },
  });
  if (duplicate) return duplicate.jobId;

  const model = getTyphoonModel();
  const job = await prisma.aIJob.create({
    data: {
      contentId,
      jobType: "READABILITY",
      provider: "typhoon",
      model,
      promptVersion: getTemplateVersion("readability"),
      inputHash,
      status: "QUEUED",
    },
  });

  // Fire-and-forget background processing
  processJob(job.id).catch(() => {
    // Error already handled in processJob
  });

  return job.id;
}