import { z } from "zod";

const rowSchema = z.record(z.string(), z.unknown());

export const backupDataSchema = z.object({
  users: z.array(rowSchema),
  categories: z.array(rowSchema),
  tags: z.array(rowSchema),
  tagAliases: z.array(rowSchema),
  series: z.array(rowSchema),
  collections: z.array(rowSchema),
  media: z.array(rowSchema),
  contents: z.array(rowSchema),
  contentTags: z.array(rowSchema),
  seriesItems: z.array(rowSchema),
  collectionItems: z.array(rowSchema),
  contentRelations: z.array(rowSchema),
  sources: z.array(rowSchema),
  revisions: z.array(rowSchema),
  aiJobs: z.array(rowSchema),
  aiSuggestions: z.array(rowSchema),
  themeActivations: z.array(rowSchema),
  siteSettings: z.array(rowSchema),
  slugRedirects: z.array(rowSchema),
  auditLogs: z.array(rowSchema),
});

export const siteBackupSchema = z.object({
  format: z.literal("knowledge-hub-backup"),
  version: z.literal(1),
  databaseSchema: z.literal("knowledge-hub-prisma-v1"),
  createdAt: z.string().datetime(),
  includesMediaFiles: z.literal(false),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  data: backupDataSchema,
});

export type SiteBackup = z.infer<typeof siteBackupSchema>;

export function validateSiteBackup(value: unknown) {
  return siteBackupSchema.safeParse(value);
}
