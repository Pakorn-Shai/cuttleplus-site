import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { buildContentArtifacts, createStoredDocument, parseStoredDocument } from "../src/core/content/document";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function backfill() {
  const contents = await prisma.content.findMany({ select: { id: true, contentJson: true } });
  for (const content of contents) {
    const stored = parseStoredDocument(content.contentJson);
    const artifacts = buildContentArtifacts(stored.readerBlocks);
    await prisma.content.update({
      where: { id: content.id },
      data: {
        contentJson: createStoredDocument(artifacts.blocks, stored.editorBlocks) as unknown as Prisma.InputJsonValue,
        contentHtml: artifacts.html,
        plainText: artifacts.plainText,
      },
    });
  }
  console.log(`Backfilled rendering artifacts for ${contents.length} content records.`);
}

backfill().finally(() => prisma.$disconnect());
