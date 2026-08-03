import { describe, expect, it } from "vitest";
import { backupDataSchema, validateSiteBackup } from "@/core/backup/schema";
import { summarizeSiteBackup } from "@/core/backup/summary";

const emptyData = Object.fromEntries(Object.keys(backupDataSchema.shape).map((key) => [key, []]));

describe("site backup schema", () => {
  it("accepts a complete versioned backup manifest", () => {
    const result = validateSiteBackup({
      format: "knowledge-hub-backup",
      version: 1,
      databaseSchema: "knowledge-hub-prisma-v1",
      createdAt: "2026-08-03T00:00:00.000Z",
      includesMediaFiles: false,
      counts: Object.fromEntries(Object.keys(emptyData).map((key) => [key, 0])),
      data: emptyData,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an incomplete or incompatible backup", () => {
    expect(validateSiteBackup({ version: 1, data: {} }).success).toBe(false);
    expect(validateSiteBackup({
      format: "knowledge-hub-backup",
      version: 2,
      databaseSchema: "knowledge-hub-prisma-v1",
      createdAt: "2026-08-03T00:00:00.000Z",
      includesMediaFiles: false,
      counts: {},
      data: emptyData,
    }).success).toBe(false);
  });

  it("summarizes restore-impact counts without exposing record contents", () => {
    const parsed = validateSiteBackup({
      format: "knowledge-hub-backup", version: 1, databaseSchema: "knowledge-hub-prisma-v1",
      createdAt: "2026-08-03T00:00:00.000Z", includesMediaFiles: false, counts: {},
      data: { ...emptyData, contents: [{ id: "one" }], revisions: [{ id: "revision" }] },
    });
    expect(parsed.success && summarizeSiteBackup(parsed.data)).toMatchObject({ contents: 1, revisions: 1, includesMediaFiles: false });
  });
});
