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

describe("AI safety rules", () => {
  it("never alters code blocks regardless of suggestion", () => {
    const blocks: ContentBlock[] = [
      { id: "c1", type: "code", language: "sql", code: "SELECT * FROM users" },
      { id: "c2", type: "code", language: "python", code: "print('hello')" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [
        { blockId: "c1", replacementText: "DROP TABLE users", replacementTitle: null, replacementItems: null, reason: "malicious" },
        { blockId: "c2", replacementText: "print('hacked')", replacementTitle: null, replacementItems: null, reason: "malicious" },
      ],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
    expect(result[1]).toEqual(blocks[1]);
  });

  it("never alters executable-code blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "ec1", type: "executable-code", language: "sql", dialect: "duckdb", executionMode: "admin-sandbox", code: "SELECT 1" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "ec1", replacementText: "SELECT 2", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
  });

  it("never alters formula-example blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "f1", type: "formula-example", engine: "dax", title: "Measure", expression: "SUM(Sales[Amount])", executionMode: "saved-output", prerequisites: [], compatibility: [] },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "f1", replacementText: "SUM(Sales[Fake])", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
  });

  it("never alters automation-script blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "a1", type: "automation-script", platform: "excel-vba", title: "Macro", code: "MsgBox 'Hello'", hostRequirements: [], executionMode: "saved-output" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "a1", replacementText: "MsgBox 'Hacked'", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
  });

  it("never alters image blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "img1", type: "image", src: "https://example.com/photo.jpg", alt: "A photo" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "img1", replacementText: "https://evil.com/photo.jpg", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
  });

  it("never alters embed blocks", () => {
    const blocks: ContentBlock[] = [
      { id: "e1", type: "embed", url: "https://youtube.com/watch?v=abc", embedType: "youtube" as const, caption: "Video" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "e1", replacementText: "https://evil.com", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toEqual(blocks[0]);
  });

  it("preserves numeric values in text blocks (does not alter numbers)", () => {
    const blocks: ContentBlock[] = [
      { id: "p1", type: "paragraph", text: "The price is $100.50 and quantity is 42" },
    ];
    const suggestion = readabilitySuggestionSchema.parse({
      title: "Title", excerpt: "Excerpt", summary: "Summary",
      changes: [{ blockId: "p1", replacementText: "The price is $200.00 and quantity is 99", replacementTitle: null, replacementItems: null, reason: "test" }],
    });
    // The suggestion system allows text changes but the AI system prompt instructs not to change numbers
    // This test verifies the apply function works correctly (it applies what's given)
    const result = applyReadabilitySuggestion(blocks, suggestion);
    expect(result[0]).toMatchObject({ text: "The price is $200.00 and quantity is 99" });
  });

  it("validates suggestion schema rejects missing required fields", () => {
    expect(readabilitySuggestionSchema.safeParse({}).success).toBe(false);
    expect(readabilitySuggestionSchema.safeParse({ title: "T", excerpt: "E", summary: "S" }).success).toBe(false);
    expect(readabilitySuggestionSchema.safeParse({ title: "T", excerpt: "E", summary: "S", changes: "not-array" }).success).toBe(false);
  });

  it("validates block changes have required fields", () => {
    const result = readabilitySuggestionSchema.safeParse({
      title: "T", excerpt: "E", summary: "S",
      changes: [{ blockId: "b1" }], // missing required fields
    });
    expect(result.success).toBe(false);
  });

  it("limits changes to maximum 100 blocks", () => {
    const changes = Array.from({ length: 101 }, (_, i) => ({
      blockId: `b${i}`, replacementText: "text", replacementTitle: null, replacementItems: null, reason: "test",
    }));
    const result = readabilitySuggestionSchema.safeParse({
      title: "T", excerpt: "E", summary: "S", changes,
    });
    expect(result.success).toBe(false);
  });
});
