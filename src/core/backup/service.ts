import "server-only";

import { prisma } from "@/lib/prisma";
import { siteBackupSchema, type SiteBackup } from "./schema";

export async function createSiteBackup(): Promise<SiteBackup> {
  const [
    users, categories, tags, tagAliases, series, collections, media, contents,
    contentTags, seriesItems, collectionItems, contentRelations, sources, revisions,
    aiJobs, aiSuggestions, themeActivations, siteSettings, slugRedirects, auditLogs,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.tag.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tagAlias.findMany({ orderBy: { id: "asc" } }),
    prisma.series.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.collection.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.content.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contentTag.findMany({ orderBy: [{ contentId: "asc" }, { tagId: "asc" }] }),
    prisma.seriesItem.findMany({ orderBy: [{ seriesId: "asc" }, { position: "asc" }] }),
    prisma.collectionItem.findMany({ orderBy: [{ collectionId: "asc" }, { position: "asc" }] }),
    prisma.contentRelation.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.source.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contentRevision.findMany({ orderBy: [{ contentId: "asc" }, { revisionNumber: "asc" }] }),
    prisma.aIJob.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.aISuggestion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.themeActivation.findMany({ orderBy: { activatedAt: "asc" } }),
    prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.slugRedirect.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const serializableData = JSON.parse(JSON.stringify({
    users, categories, tags, tagAliases, series, collections, media, contents,
    contentTags, seriesItems, collectionItems, contentRelations, sources, revisions,
    aiJobs, aiSuggestions, themeActivations, siteSettings, slugRedirects, auditLogs,
  })) as SiteBackup["data"];
  const counts = Object.fromEntries(Object.entries(serializableData).map(([key, rows]) => [key, rows.length]));
  return siteBackupSchema.parse({
    format: "knowledge-hub-backup",
    version: 1,
    databaseSchema: "knowledge-hub-prisma-v1",
    createdAt: new Date().toISOString(),
    includesMediaFiles: false,
    counts,
    data: serializableData,
  });
}

export function serializeSiteBackup(backup: SiteBackup) {
  return JSON.stringify(backup, null, 2) + "\n";
}
