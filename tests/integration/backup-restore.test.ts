import { beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { validateSiteBackup, type SiteBackup } from "@/core/backup/schema";
import { createSiteBackup } from "@/core/backup/service";
import { executeRestore, planRestore, validateBackupIntegrity } from "@/core/backup/restore";
import { prisma } from "@/lib/prisma";

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "AuditLog", "AISuggestion", "AIJob", "ContentRevision", "ContentTag",
    "SeriesItem", "CollectionItem", "ContentRelation", "Source", "Content",
    "TagAlias", "Tag", "Category", "Series", "Collection", "Media", "User",
    "ThemeActivation", "SiteSetting", "SlugRedirect", "RateLimitBucket"
    RESTART IDENTITY CASCADE`);
}

async function seedFixture() {
  const owner = await prisma.user.create({ data: { email: "restore-owner@example.com", name: "Restore Owner" } });
  const category = await prisma.category.create({ data: { name: "SQL", slug: "sql" } });
  const tag = await prisma.tag.create({ data: { name: "Database", slug: "database" } });
  const content = await prisma.content.create({ data: {
    title: "บทความต้นฉบับ",
    slug: "restore-original",
    excerpt: "เกริ่นต้นฉบับ",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    categoryId: category.id,
    contentJson: { readerBlocks: [], editorBlocks: [] } as unknown as Prisma.InputJsonValue,
    contentHtml: "<p>เนื้อหาต้นฉบับ</p>",
    plainText: "เนื้อหาต้นฉบับ",
  } });
  await prisma.contentTag.create({ data: { contentId: content.id, tagId: tag.id } });
  await prisma.contentRevision.create({ data: {
    contentId: content.id,
    revisionNumber: 1,
    title: "บทความต้นฉบับ",
    contentJson: { readerBlocks: [], editorBlocks: [] } as unknown as Prisma.InputJsonValue,
    contentHtml: "<p>เนื้อหาต้นฉบับ</p>",
    plainText: "เนื้อหาต้นฉบับ",
    source: "MANUAL",
    createdById: owner.id,
  } });
  await prisma.siteSetting.create({ data: { key: "siteName", valueJson: "Knowledge Hub" as unknown as Prisma.InputJsonValue } });
  return { owner, category, tag, content };
}

beforeEach(resetDatabase);

describe("backup restore integration", () => {
  it("restores a valid backup and replaces current data atomically", async () => {
    const { owner, content } = await seedFixture();

    // Capture the original state as a backup.
    const backup = await createSiteBackup();

    // Mutate the database so it diverges from the backup.
    await prisma.content.update({ where: { id: content.id }, data: { title: "ชื่อที่แก้หลัง Backup" } });
    await prisma.tag.create({ data: { name: "แท็กใหม่", slug: "new-tag" } });

    // Execute the restore.
    const result = await executeRestore(backup, owner.id);

    // Verify the data matches the backup, not the mutated state.
    const restoredContent = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(restoredContent.title).toBe("บทความต้นฉบับ");

    const tagCount = await prisma.tag.count();
    expect(tagCount).toBe(1); // "แท็กใหม่" should be gone.

    const tags = await prisma.tag.findMany();
    expect(tags[0].slug).toBe("database");

    // Verify the audit log records the restore.
    const auditLogs = await prisma.auditLog.findMany({ where: { action: "DATABASE_RESTORED" } });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].entityType).toBe("Database");

    // Verify the pre-restore backup was captured.
    expect(result.preRestoreBackupJson).toContain("ชื่อที่แก้หลัง Backup");
    expect(result.inserted.contents).toBe(1);
  });

  it("produces a dry-run plan without modifying the database", async () => {
    const { owner } = await seedFixture();
    const backup = await createSiteBackup();

    // Add extra data after the backup.
    await prisma.tag.create({ data: { name: "แท็กเพิ่ม", slug: "extra-tag" } });

    const plan = await planRestore(backup);

    // Plan should reflect current DB (2 tags) vs backup (1 tag).
    const tagPlan = plan.tables.find((t) => t.table === "tags");
    expect(tagPlan?.currentCount).toBe(2);
    expect(tagPlan?.backupCount).toBe(1);
    expect(plan.totalCurrent).toBeGreaterThan(plan.totalBackup);
    expect(plan.warnings.length).toBeGreaterThan(0);

    // Database must be unchanged after planning.
    expect(await prisma.tag.count()).toBe(2);
    expect(await prisma.content.count()).toBe(1);
    void owner;
  });

  it("rejects a backup with broken referential integrity", async () => {
    await seedFixture();
    const backup = await createSiteBackup();

    // Corrupt the backup: point a contentTag to a non-existent tag.
    const corrupted: SiteBackup = {
      ...backup,
      data: {
        ...backup.data,
        contentTags: backup.data.contentTags.map((row) => ({ ...row, tagId: "missing-tag-id" })),
      },
    };

    const issues = validateBackupIntegrity(corrupted);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.table === "contentTags")).toBe(true);
  });

  it("rejects a backup with a dangling category parent reference", async () => {
    await seedFixture();
    const backup = await createSiteBackup();

    const corrupted: SiteBackup = {
      ...backup,
      data: {
        ...backup.data,
        categories: backup.data.categories.map((row) => ({ ...row, parentId: "missing-parent" })),
      },
    };

    const issues = validateBackupIntegrity(corrupted);
    expect(issues.some((issue) => issue.table === "categories")).toBe(true);
  });

  it("rolls back the entire transaction when a write fails", async () => {
    const { owner, content } = await seedFixture();
    const backup = await createSiteBackup();

    // Corrupt the backup so it passes integrity checks but fails on insert:
    // duplicate the content row to violate the unique slug constraint.
    const duplicatedContent = [...backup.data.contents, { ...backup.data.contents[0], id: "duplicate-id" }];
    const corrupted: SiteBackup = {
      ...backup,
      data: { ...backup.data, contents: duplicatedContent },
    };

    // Integrity check should pass (all FK refs are valid).
    expect(validateBackupIntegrity(corrupted)).toHaveLength(0);

    // Execute should throw due to unique constraint violation.
    await expect(executeRestore(corrupted, owner.id)).rejects.toThrow();

    // Database must be unchanged after the failed restore.
    const restoredContent = await prisma.content.findUniqueOrThrow({ where: { id: content.id } });
    expect(restoredContent.title).toBe("บทความต้นฉบับ");
    expect(await prisma.content.count()).toBe(1);
    expect(await prisma.tag.count()).toBe(1);
  });

  it("validates backup schema before restore", () => {
    const invalid = validateSiteBackup({ version: 99, data: {} });
    expect(invalid.success).toBe(false);
  });

  it("preserves category hierarchy through restore", async () => {
    const owner = await prisma.user.create({ data: { email: "hierarchy-owner@example.com" } });
    const parent = await prisma.category.create({ data: { name: "Parent", slug: "parent" } });
    await prisma.category.create({ data: { name: "Child", slug: "child", parentId: parent.id } });

    const backup = await createSiteBackup();

    // Delete everything and restore.
    await executeRestore(backup, owner.id);

    const child = await prisma.category.findUniqueOrThrow({ where: { slug: "child" } });
    expect(child.parentId).toBe(parent.id);

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    expect(categories).toHaveLength(2);
  });
});