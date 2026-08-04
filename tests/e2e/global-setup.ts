import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { contentSnapshotHash } from "../../src/core/ai/content-hash";
import { createStoredDocument, readerBlocksToEditorBlocks } from "../../src/core/content/document";
import { configureTestDatabase } from "../helpers/test-database";
import { resetIsolatedTestDatabase } from "../helpers/reset-test-database";

function run(command: string, args: string[], databaseUrl: string) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed.\n${result.stderr || result.stdout}`);
}

export default async function globalSetup() {
  const databaseUrl = configureTestDatabase();
  run("npx", ["prisma", "migrate", "deploy"], databaseUrl);
  await resetIsolatedTestDatabase();
  run("npx", ["tsx", "prisma/seed.ts"], databaseUrl);

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const blocks = [{ id: "e2e-ai-intro", type: "paragraph" as const, text: "E2E AI original text" }];
    const document = createStoredDocument(blocks, readerBlocksToEditorBlocks(blocks));
    const content = await client.content.create({ data: {
      title: "E2E AI Original",
      slug: "e2e-ai-action",
      excerpt: "Original excerpt",
      status: "DRAFT",
      visibility: "PRIVATE",
      contentJson: document as unknown as Prisma.InputJsonValue,
      contentHtml: "<p>E2E AI original text</p>",
      plainText: "E2E AI original text",
    } });
    const job = await client.aIJob.create({ data: {
      contentId: content.id,
      jobType: "READABILITY",
      provider: "fixture",
      model: "deterministic",
      promptVersion: "e2e-v1",
      inputHash: contentSnapshotHash(content),
      status: "COMPLETED",
      completedAt: new Date(),
    } });
    await client.aISuggestion.create({ data: {
      contentId: content.id,
      jobId: job.id,
      suggestionType: "READABILITY",
      originalJson: { title: content.title, excerpt: content.excerpt ?? "", blocks },
      suggestedJson: {
        title: "E2E AI Accepted",
        excerpt: "Accepted excerpt",
        summary: "Deterministic browser fixture",
        changes: [{
          blockId: "e2e-ai-intro",
          replacementText: "E2E AI accepted text",
          replacementTitle: null,
          replacementItems: null,
          reason: "Verify the real Admin action",
        }],
      },
    } });
  } finally {
    await client.$disconnect();
  }
}
