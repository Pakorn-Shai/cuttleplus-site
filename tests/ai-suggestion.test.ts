import { describe, expect, it } from "vitest";
import { applyReadabilitySuggestion, readabilitySuggestionSchema } from "@/core/ai/suggestion";
import { contentSnapshotHash, legacyContentSnapshotHash, matchesOriginalSuggestionSnapshot } from "@/core/ai/content-hash";
import type { ContentBlock } from "@/core/content/types";

describe("AI readability suggestions", () => {
  it("uses the same content hash regardless of Prisma relations included at runtime", () => {
    const content = { title: "ชื่อเดิม", excerpt: "เกริ่นเดิม", contentJson: { version: 1, readerBlocks: [] } };
    const withRelations = { ...content, revisions: [{ id: "revision-1" }], aiJobs: [{ id: "job-1" }] };

    expect(contentSnapshotHash(withRelations)).toBe(contentSnapshotHash(content));
    expect(legacyContentSnapshotHash(withRelations)).not.toBe(contentSnapshotHash(content));
  });

  it("recognizes an unchanged persisted reader snapshot for legacy suggestions", () => {
    const blocks = [{ id: "intro", type: "paragraph", text: "ข้อความเดิม" }];
    const content = {
      title: "ชื่อเดิม",
      excerpt: "เกริ่นเดิม",
      contentJson: { version: 1, readerBlocks: blocks, editorBlocks: [{ id: "editor-metadata" }] },
    };
    const original = { title: "ชื่อเดิม", excerpt: "เกริ่นเดิม", blocks };

    expect(matchesOriginalSuggestionSnapshot(content, original)).toBe(true);
    expect(matchesOriginalSuggestionSnapshot(
      { ...content, contentJson: { ...content.contentJson, readerBlocks: [{ ...blocks[0], text: "แก้ภายหลัง" }] } },
      original,
    )).toBe(false);
  });

  it("applies only reviewed text fields and never changes code blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "intro", type: "paragraph", text: "ข้อความเดิม" },
      { id: "code", type: "code", language: "js", code: "dangerousButOriginal()" },
      { id: "steps", type: "list", items: ["เดิม"] },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "ชื่อใหม่", excerpt: "คำอธิบายใหม่", summary: "ปรับให้อ่านง่าย",
      changes: [
        { blockId: "intro", replacementText: "ข้อความใหม่", replacementTitle: null, replacementItems: null, reason: "กระชับขึ้น" },
        { blockId: "code", replacementText: "changed()", replacementTitle: null, replacementItems: null, reason: "ไม่ควรถูกใช้" },
        { blockId: "steps", replacementText: null, replacementTitle: null, replacementItems: ["ใหม่ 1", "ใหม่ 2"], reason: "ชัดขึ้น" },
      ],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toMatchObject({ text: "ข้อความใหม่" });
    expect(result[1]).toEqual(blocks[1]);
    expect(result[2]).toMatchObject({ items: ["ใหม่ 1", "ใหม่ 2"] });
  });

  it("rejects incomplete structured output", () => {
    expect(readabilitySuggestionSchema.safeParse({ title: "Title" }).success).toBe(false);
  });
});
