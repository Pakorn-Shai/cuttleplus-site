import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { configureTestDatabase } from "./test-database";

export async function resetIsolatedTestDatabase() {
  const databaseUrl = configureTestDatabase();
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    await client.$executeRawUnsafe(`TRUNCATE TABLE
      "AuditLog", "AISuggestion", "AIJob", "ContentRevision", "ContentTag",
      "SeriesItem", "CollectionItem", "ContentRelation", "Source", "Content",
      "TagAlias", "Tag", "Category", "Series", "Collection", "Media", "User",
      "ThemeActivation", "SiteSetting", "SlugRedirect", "RateLimitBucket"
      RESTART IDENTITY CASCADE`);
  } finally {
    await client.$disconnect();
  }
}

