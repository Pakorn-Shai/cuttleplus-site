import "server-only";

import { prisma } from "@/lib/prisma";
import type { SiteBackup } from "./schema";
import { createSiteBackup, serializeSiteBackup } from "./service";

/**
 * Restore strategy: full replace.
 *
 * A restore deletes every application table that is part of the backup and
 * re-inserts the backup rows with their original ids. Operational tables that
 * are never part of a backup (`RateLimitBucket`, Prisma migration bookkeeping)
 * are left untouched.
 *
 * The workflow is split into three isolated phases so each can be tested and
 * reasoned about independently:
 *   1. `validateBackupIntegrity` — pure, no database access. Checks that all
 *      foreign-key references inside the backup resolve.
 *   2. `planRestore` — read-only. Compares the backup with the live database
 *      and produces a per-table impact summary for the confirmation UI.
 *   3. `executeRestore` — writes inside a single transaction after creating a
 *      pre-restore backup of the current state.
 */

export type BackupTableKey = keyof SiteBackup["data"];

/** Deletion order: children before parents so FK constraints never fire. */
const DELETE_ORDER: readonly BackupTableKey[] = [
  "aiSuggestions",
  "aiJobs",
  "revisions",
  "sources",
  "contentRelations",
  "collectionItems",
  "seriesItems",
  "contentTags",
  "contents",
  "tagAliases",
  "auditLogs",
  "media",
  "collections",
  "series",
  "tags",
  "categories",
  "themeActivations",
  "siteSettings",
  "slugRedirects",
  "users",
];

/** Insertion order: parents before children. Reverse of DELETE_ORDER. */
const INSERT_ORDER: readonly BackupTableKey[] = [
  "users",
  "categories",
  "tags",
  "tagAliases",
  "series",
  "collections",
  "media",
  "contents",
  "contentTags",
  "seriesItems",
  "collectionItems",
  "contentRelations",
  "sources",
  "revisions",
  "aiJobs",
  "aiSuggestions",
  "themeActivations",
  "siteSettings",
  "slugRedirects",
  "auditLogs",
];

/** Fields stored as ISO strings in JSON that must become Date objects again. */
const DATE_FIELDS: Record<BackupTableKey, readonly string[]> = {
  users: ["createdAt", "updatedAt"],
  categories: ["createdAt", "updatedAt"],
  tags: ["createdAt", "updatedAt"],
  tagAliases: [],
  series: ["createdAt", "updatedAt"],
  collections: ["createdAt", "updatedAt"],
  media: ["createdAt", "updatedAt"],
  contents: ["publishedAt", "scheduledAt", "createdAt", "updatedAt", "deletedAt"],
  contentTags: [],
  seriesItems: [],
  collectionItems: [],
  contentRelations: ["createdAt"],
  sources: ["publishedAt", "accessedAt", "createdAt"],
  revisions: ["createdAt"],
  aiJobs: ["createdAt", "completedAt"],
  aiSuggestions: ["createdAt", "reviewedAt"],
  themeActivations: ["activatedAt", "updatedAt"],
  siteSettings: ["updatedAt"],
  slugRedirects: ["createdAt"],
  auditLogs: ["createdAt"],
};

const TABLE_LABELS: Record<BackupTableKey, string> = {
  users: "ผู้ใช้งาน",
  categories: "หมวดหมู่",
  tags: "แท็ก",
  tagAliases: "Tag Alias",
  series: "Series",
  collections: "Collection",
  media: "Media (metadata)",
  contents: "เนื้อหา",
  contentTags: "Content ↔ Tag",
  seriesItems: "Series items",
  collectionItems: "Collection items",
  contentRelations: "Relations",
  sources: "Sources",
  revisions: "Revisions",
  aiJobs: "AI jobs",
  aiSuggestions: "AI suggestions",
  themeActivations: "Theme activations",
  siteSettings: "การตั้งค่าเว็บไซต์",
  slugRedirects: "Slug redirects",
  auditLogs: "Audit log",
};

// ---------------------------------------------------------------------------
// Phase 1 — validation (pure, no database)
// ---------------------------------------------------------------------------

export interface IntegrityIssue {
  table: BackupTableKey;
  message: string;
}

function collectIds(rows: readonly Record<string, unknown>[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (typeof row.id === "string") ids.add(row.id);
  }
  return ids;
}

function collectCompositeIds(rows: readonly Record<string, unknown>[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (typeof row.contentId === "string" && typeof row.tagId === "string") ids.add(`${row.contentId}:${row.tagId}`);
  }
  return ids;
}

/**
 * Verifies that every foreign-key reference inside the backup resolves to a
 * row that is also present in the backup. This catches corrupted or partially
 * exported files before any database write is attempted.
 */
export function validateBackupIntegrity(backup: SiteBackup): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const data = backup.data;

  const userIds = collectIds(data.users);
  const categoryIds = collectIds(data.categories);
  const tagIds = collectIds(data.tags);
  const seriesIds = collectIds(data.series);
  const collectionIds = collectIds(data.collections);
  const mediaIds = collectIds(data.media);
  const contentIds = collectIds(data.contents);
  const revisionIds = collectIds(data.revisions);
  const aiJobIds = collectIds(data.aiJobs);

  const requireRef = (
    table: BackupTableKey,
    rows: readonly Record<string, unknown>[],
    field: string,
    target: Set<string>,
    targetLabel: string,
    options?: { nullable?: boolean; compositeField?: string },
  ) => {
    for (const row of rows) {
      const value = row[field];
      if (value == null) {
        if (!options?.nullable) issues.push({ table, message: `แถวใน ${TABLE_LABELS[table]} ขาด ${field}` });
        continue;
      }
      if (typeof value !== "string" || !target.has(value)) {
        issues.push({ table, message: `${TABLE_LABELS[table]} อ้างอิง ${targetLabel} (${field}=${String(value)}) ที่ไม่มีใน Backup` });
      }
    }
  };

  // Category self-reference.
  for (const row of data.categories) {
    if (row.parentId != null && (typeof row.parentId !== "string" || !categoryIds.has(row.parentId))) {
      issues.push({ table: "categories", message: `หมวดหมู่อ้างอิง parent (${String(row.parentId)}) ที่ไม่มีใน Backup` });
    }
  }

  requireRef("contents", data.contents, "categoryId", categoryIds, "หมวดหมู่", { nullable: true });
  requireRef("contents", data.contents, "coverMediaId", mediaIds, "Media", { nullable: true });
  requireRef("contentTags", data.contentTags, "contentId", contentIds, "เนื้อหา");
  requireRef("contentTags", data.contentTags, "tagId", tagIds, "แท็ก");
  requireRef("seriesItems", data.seriesItems, "seriesId", seriesIds, "Series");
  requireRef("seriesItems", data.seriesItems, "contentId", contentIds, "เนื้อหา");
  requireRef("collectionItems", data.collectionItems, "collectionId", collectionIds, "Collection");
  requireRef("collectionItems", data.collectionItems, "contentId", contentIds, "เนื้อหา");
  requireRef("contentRelations", data.contentRelations, "sourceContentId", contentIds, "เนื้อหาต้นทาง");
  requireRef("contentRelations", data.contentRelations, "targetContentId", contentIds, "เนื้อหาปลายทาง");
  requireRef("sources", data.sources, "contentId", contentIds, "เนื้อหา");
  requireRef("revisions", data.revisions, "contentId", contentIds, "เนื้อหา");
  requireRef("revisions", data.revisions, "createdById", userIds, "ผู้ใช้", { nullable: true });
  requireRef("aiJobs", data.aiJobs, "contentId", contentIds, "เนื้อหา", { nullable: true });
  requireRef("aiSuggestions", data.aiSuggestions, "contentId", contentIds, "เนื้อหา");
  requireRef("aiSuggestions", data.aiSuggestions, "revisionId", revisionIds, "Revision", { nullable: true });
  requireRef("aiSuggestions", data.aiSuggestions, "jobId", aiJobIds, "AI job");
  requireRef("tagAliases", data.tagAliases, "tagId", tagIds, "แท็ก");
  requireRef("auditLogs", data.auditLogs, "userId", userIds, "ผู้ใช้", { nullable: true });

  // Detect duplicate composite keys that would violate primary keys.
  const contentTagKeys = collectCompositeIds(data.contentTags);
  if (contentTagKeys.size !== data.contentTags.length) {
    issues.push({ table: "contentTags", message: "พบ Content ↔ Tag ซ้ำกันใน Backup" });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Phase 2 — planning (read-only)
// ---------------------------------------------------------------------------

export interface RestoreTablePlan {
  table: BackupTableKey;
  label: string;
  currentCount: number;
  backupCount: number;
}

export interface RestorePlan {
  backupCreatedAt: string;
  tables: RestoreTablePlan[];
  totalCurrent: number;
  totalBackup: number;
  warnings: string[];
}

async function countTable(table: BackupTableKey): Promise<number> {
  switch (table) {
    case "users": return prisma.user.count();
    case "categories": return prisma.category.count();
    case "tags": return prisma.tag.count();
    case "tagAliases": return prisma.tagAlias.count();
    case "series": return prisma.series.count();
    case "collections": return prisma.collection.count();
    case "media": return prisma.media.count();
    case "contents": return prisma.content.count();
    case "contentTags": return prisma.contentTag.count();
    case "seriesItems": return prisma.seriesItem.count();
    case "collectionItems": return prisma.collectionItem.count();
    case "contentRelations": return prisma.contentRelation.count();
    case "sources": return prisma.source.count();
    case "revisions": return prisma.contentRevision.count();
    case "aiJobs": return prisma.aIJob.count();
    case "aiSuggestions": return prisma.aISuggestion.count();
    case "themeActivations": return prisma.themeActivation.count();
    case "siteSettings": return prisma.siteSetting.count();
    case "slugRedirects": return prisma.slugRedirect.count();
    case "auditLogs": return prisma.auditLog.count();
  }
}

export async function planRestore(backup: SiteBackup): Promise<RestorePlan> {
  const tables: RestoreTablePlan[] = [];
  let totalCurrent = 0;
  let totalBackup = 0;

  for (const table of INSERT_ORDER) {
    const currentCount = await countTable(table);
    const backupCount = backup.data[table].length;
    tables.push({ table, label: TABLE_LABELS[table], currentCount, backupCount });
    totalCurrent += currentCount;
    totalBackup += backupCount;
  }

  const warnings: string[] = [
    "การ Restore จะลบข้อมูลปัจจุบันทั้งหมดแล้วแทนที่ด้วยข้อมูลใน Backup",
    "ระบบจะสร้าง Backup ของสถานะปัจจุบันไว้ก่อนเริ่มเขียนเสมอ",
  ];
  if (!backup.includesMediaFiles) {
    warnings.push("ไฟล์รูปจริงใน object storage ไม่ได้รวมอยู่ใน Backup นี้ มีเฉพาะ metadata ของ Media");
  }
  if (totalCurrent > 0) {
    warnings.push(`ข้อมูลปัจจุบัน ${totalCurrent} record จะถูกลบและแทนที่ด้วย ${totalBackup} record จาก Backup`);
  }

  return { backupCreatedAt: backup.createdAt, tables, totalCurrent, totalBackup, warnings };
}

// ---------------------------------------------------------------------------
// Phase 3 — writing (transactional)
// ---------------------------------------------------------------------------

export interface RestoreResult {
  restoredAt: string;
  backupCreatedAt: string;
  inserted: Record<string, number>;
  preRestoreBackupJson: string;
}

function prepareRows(table: BackupTableKey, rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  const dateFields = DATE_FIELDS[table];
  return rows.map((row) => {
    const prepared: Record<string, unknown> = { ...row };
    for (const field of dateFields) {
      const value = prepared[field];
      if (value != null) prepared[field] = new Date(value as string);
    }
    return prepared;
  });
}

/**
 * Sort categories so parents are inserted before children, then neutralise
 * the self-reference for the initial bulk insert and patch it back afterwards.
 */
function orderCategories(rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  const byId = new Map(rows.map((row) => [row.id as string, row]));
  const ordered: Record<string, unknown>[] = [];
  const visited = new Set<string>();

  const visit = (row: Record<string, unknown>) => {
    const id = row.id as string;
    if (visited.has(id)) return;
    visited.add(id);
    const parentId = row.parentId;
    if (typeof parentId === "string" && byId.has(parentId) && parentId !== id) {
      visit(byId.get(parentId) as Record<string, unknown>);
    }
    ordered.push(row);
  };

  for (const row of rows) visit(row);
  return ordered;
}

async function deleteAll(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<void> {
  for (const table of DELETE_ORDER) {
    switch (table) {
      case "aiSuggestions": await tx.aISuggestion.deleteMany(); break;
      case "aiJobs": await tx.aIJob.deleteMany(); break;
      case "revisions": await tx.contentRevision.deleteMany(); break;
      case "sources": await tx.source.deleteMany(); break;
      case "contentRelations": await tx.contentRelation.deleteMany(); break;
      case "collectionItems": await tx.collectionItem.deleteMany(); break;
      case "seriesItems": await tx.seriesItem.deleteMany(); break;
      case "contentTags": await tx.contentTag.deleteMany(); break;
      case "contents": await tx.content.deleteMany(); break;
      case "tagAliases": await tx.tagAlias.deleteMany(); break;
      case "auditLogs": await tx.auditLog.deleteMany(); break;
      case "media": await tx.media.deleteMany(); break;
      case "collections": await tx.collection.deleteMany(); break;
      case "series": await tx.series.deleteMany(); break;
      case "tags": await tx.tag.deleteMany(); break;
      case "categories": await tx.category.deleteMany(); break;
      case "themeActivations": await tx.themeActivation.deleteMany(); break;
      case "siteSettings": await tx.siteSetting.deleteMany(); break;
      case "slugRedirects": await tx.slugRedirect.deleteMany(); break;
      case "users": await tx.user.deleteMany(); break;
    }
  }
}

async function insertAll(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  backup: SiteBackup,
): Promise<Record<string, number>> {
  const inserted: Record<string, number> = {};
  const data = backup.data;

  for (const table of INSERT_ORDER) {
    const rows = prepareRows(table, data[table]);
    let count = 0;

    switch (table) {
      case "users":
        if (rows.length) await tx.user.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "categories": {
        const ordered = orderCategories(rows);
        if (ordered.length) {
          await tx.category.createMany({ data: ordered.map((row) => ({ ...row, parentId: null })) as never[] });
          const withParents = ordered.filter((row) => row.parentId != null);
          for (const row of withParents) {
            await tx.category.update({ where: { id: row.id as string }, data: { parentId: row.parentId as string } });
          }
        }
        count = ordered.length;
        break;
      }
      case "tags":
        if (rows.length) await tx.tag.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "tagAliases":
        if (rows.length) await tx.tagAlias.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "series":
        if (rows.length) await tx.series.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "collections":
        if (rows.length) await tx.collection.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "media":
        if (rows.length) await tx.media.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "contents":
        if (rows.length) await tx.content.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "contentTags":
        if (rows.length) await tx.contentTag.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "seriesItems":
        if (rows.length) await tx.seriesItem.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "collectionItems":
        if (rows.length) await tx.collectionItem.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "contentRelations":
        if (rows.length) await tx.contentRelation.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "sources":
        if (rows.length) await tx.source.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "revisions":
        if (rows.length) await tx.contentRevision.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "aiJobs":
        if (rows.length) await tx.aIJob.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "aiSuggestions":
        if (rows.length) await tx.aISuggestion.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "themeActivations":
        if (rows.length) await tx.themeActivation.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "siteSettings":
        if (rows.length) await tx.siteSetting.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "slugRedirects":
        if (rows.length) await tx.slugRedirect.createMany({ data: rows as never[] });
        count = rows.length;
        break;
      case "auditLogs":
        if (rows.length) await tx.auditLog.createMany({ data: rows as never[] });
        count = rows.length;
        break;
    }

    inserted[table] = count;
  }

  return inserted;
}

/**
 * Executes a confirmed restore. A full backup of the current state is created
 * first and returned so the caller can persist it; the actual replace happens
 * inside a single transaction so a failure never leaves a half-written database.
 */
export async function executeRestore(backup: SiteBackup, userId: string): Promise<RestoreResult> {
  const preRestoreBackup = await createSiteBackup();
  const preRestoreBackupJson = serializeSiteBackup(preRestoreBackup);

  const inserted = await prisma.$transaction(
    async (tx) => {
      await deleteAll(tx);
      const written = await insertAll(tx, backup);
      await tx.auditLog.create({
        data: {
          userId,
          action: "DATABASE_RESTORED",
          entityType: "Database",
          entityId: backup.createdAt,
          metadataJson: {
            backupCreatedAt: backup.createdAt,
            backupVersion: backup.version,
            inserted: written,
          },
        },
      });
      return written;
    },
    { timeout: 120_000 },
  );

  return {
    restoredAt: new Date().toISOString(),
    backupCreatedAt: backup.createdAt,
    inserted,
    preRestoreBackupJson,
  };
}