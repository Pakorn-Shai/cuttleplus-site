import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { buildContentArtifacts, createStoredDocument } from "../src/core/content/document";
import { categories, sampleContents } from "../src/lib/sample-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const contentType = {
  Tutorial: "TUTORIAL",
  "Knowledge Note": "KNOWLEDGE_NOTE",
  "Code Snippet": "CODE_SNIPPET",
  "Learning Log": "LEARNING_LOG",
} as const;

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail) {
    await prisma.user.upsert({ where: { email: ownerEmail }, update: {}, create: { email: ownerEmail, name: "Knowledge Owner" } });
  }

  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, color: category.color, icon: category.icon, sortOrder: index },
      create: { name: category.name, slug: category.slug, color: category.color, icon: category.icon, sortOrder: index },
    });
  }

  for (const content of sampleContents) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: content.category.slug } });
    const tags = await Promise.all(content.tags.map((name) => prisma.tag.upsert({
      where: { slug: name.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `tag-${name.length}` },
      update: { name },
      create: { name, slug: name.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `tag-${name.length}` },
    })));
    const artifacts = buildContentArtifacts(content.blocks);
    const document = createStoredDocument(artifacts.blocks);
    const data = {
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      contentType: contentType[content.type],
      status: content.status === "published" ? "PUBLISHED" as const : "DRAFT" as const,
      visibility: content.visibility.toUpperCase() as "PRIVATE" | "UNLISTED" | "PUBLIC",
      contentJson: document as unknown as Prisma.InputJsonValue,
      contentHtml: artifacts.html,
      plainText: artifacts.plainText,
      readingTime: content.readingTime,
      featured: content.featured ?? false,
      publishedAt: content.publishedAt ? new Date(`${content.publishedAt}T00:00:00.000Z`) : null,
      categoryId: category.id,
    };
    await prisma.content.upsert({
      where: { slug: content.slug },
      update: { ...data, tags: { deleteMany: {}, create: tags.map((tag) => ({ tagId: tag.id })) } },
      create: { ...data, tags: { create: tags.map((tag) => ({ tagId: tag.id })) } },
    });
  }

  await prisma.themeActivation.upsert({
    where: { id: "active-theme" },
    update: { themeId: "default", themeVersion: "0.1.0", settingsJson: {} },
    create: { id: "active-theme", themeId: "default", themeVersion: "0.1.0", settingsJson: {} },
  });
}

seed()
  .then(() => console.log("Seeded Knowledge Hub database."))
  .finally(() => prisma.$disconnect());
