import type { SiteBackup } from "./schema";

export function summarizeSiteBackup(backup: SiteBackup) {
  return {
    createdAt: backup.createdAt,
    version: backup.version,
    contents: backup.data.contents.length,
    revisions: backup.data.revisions.length,
    categories: backup.data.categories.length,
    tags: backup.data.tags.length,
    mediaRecords: backup.data.media.length,
    includesMediaFiles: backup.includesMediaFiles,
  };
}
