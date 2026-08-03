import { describe, expect, it } from "vitest";
import { blocksToMarkdown, contentToJson, contentToMarkdown, type ExportableContent } from "@/core/content/export";

const content: ExportableContent = {
  id: "content-1",
  title: "SQL: หน้าต่าง",
  slug: "sql-window",
  excerpt: "สรุปสั้น",
  contentType: "TUTORIAL",
  status: "DRAFT",
  visibility: "PRIVATE",
  featured: false,
  readingTime: 2,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  publishedAt: null,
  category: { name: "Data", slug: "data" },
  tags: ["SQL", "Analytics"],
  blocks: [
    { id: "heading", type: "heading", level: 2, text: "ตัวอย่าง" },
    { id: "intro", type: "paragraph", text: "อ่านให้ง่าย" },
    { id: "steps", type: "list", items: ["ข้อแรก", "ข้อสอง"] },
    { id: "code", type: "code", language: "sql", code: "select `value` from demo;" },
  ],
};

describe("content export", () => {
  it("serializes every reader block to readable Markdown", () => {
    const markdown = blocksToMarkdown(content.blocks);
    expect(markdown).toContain("## ตัวอย่าง");
    expect(markdown).toContain("- ข้อแรก\n- ข้อสอง");
    expect(markdown).toContain("```sql\nselect `value` from demo;\n```");
  });

  it("includes portable metadata in Markdown frontmatter", () => {
    const markdown = contentToMarkdown(content);
    expect(markdown).toContain('title: "SQL: หน้าต่าง"');
    expect(markdown).toContain('tags: ["SQL","Analytics"]');
    expect(markdown).toContain('updatedAt: "2026-08-02T00:00:00.000Z"');
  });

  it("creates a versioned JSON export with stable dates", () => {
    const exported = JSON.parse(contentToJson(content, new Date("2026-08-03T00:00:00.000Z")));
    expect(exported.exportVersion).toBe(1);
    expect(exported.exportedAt).toBe("2026-08-03T00:00:00.000Z");
    expect(exported.content.blocks).toEqual(content.blocks);
  });

  it("exports formula and automation saved output without screenshots", () => {
    const markdown = blocksToMarkdown([
      {
        id: "dax-1", type: "formula-example", engine: "dax", artifactType: "measure", title: "Total Sales",
        expression: "Total Sales = SUM(Sales[Amount])", prerequisites: ["Sales table"], compatibility: ["Power BI"],
        executionMode: "saved-output", output: { type: "table", columns: ["Region", "Total"], rows: [["North", 125400]] },
      },
      {
        id: "vba-1", type: "automation-script", platform: "excel-vba", title: "Summarize Sales", code: "Sub Run()\nEnd Sub",
        hostRequirements: ["Excel Desktop"], executionMode: "saved-output", output: { type: "text", value: "Summary!E2 = 125400" },
      },
    ]);
    expect(markdown).toContain("Total Sales = SUM(Sales[Amount])");
    expect(markdown).toContain("| North | 125400 |");
    expect(markdown).toContain("Summary!E2 = 125400");
  });
});
