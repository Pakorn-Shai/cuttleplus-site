import { describe, expect, it } from "vitest";
import { blockToMarkdown, blockToPlainText, blockToSafeHtml } from "@/core/content/blocks/registry";
import { blocksToSafeHtml, buildContentArtifacts, contentBlockSchema, editorBlocksToReaderBlocks, mergeLearningBlocksIntoEditorBlocks, readerBlocksToEditorBlocks } from "@/core/content/document";
import type { ContentBlock } from "@/core/content/types";

describe("content rendering pipeline", () => {
  it("escapes user-controlled text and code instead of emitting executable markup", () => {
    const blocks: ContentBlock[] = [
      { id: "unsafe", type: "paragraph", text: "Hello <script>alert('x')</script>" },
      { id: "code", type: "code", language: "html onload=bad", code: "<img src=x onerror=alert(1)>" },
    ];
    const html = blocksToSafeHtml(blocks);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onload=");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("creates stable unique heading ids, table-of-contents data, and plain text", () => {
    const artifacts = buildContentArtifacts([
      { id: "first", type: "heading", level: 2, text: "เริ่มต้น SQL" },
      { id: "body", type: "paragraph", text: "อ่านข้อมูล" },
      { id: "second", type: "heading", level: 3, text: "เริ่มต้น SQL" },
    ]);
    expect(artifacts.headings).toEqual([
      { id: "เริ่มต้น-sql", level: 2, text: "เริ่มต้น SQL" },
      { id: "เริ่มต้น-sql-2", level: 3, text: "เริ่มต้น SQL" },
    ]);
    expect(artifacts.plainText).toBe("เริ่มต้น SQL\nอ่านข้อมูล\nเริ่มต้น SQL");
    expect(artifacts.html).toContain('id="เริ่มต้น-sql-2"');
  });

  it("validates and safely renders owner-authored learning examples with structured output", () => {
    const formula = contentBlockSchema.parse({
      id: "formula-1",
      type: "formula-example",
      engine: "excel",
      artifactType: "cell-formula",
      title: "ยอดรวม <script>alert(1)</script>",
      expression: "=SUM(B2:B10)",
      prerequisites: ["ช่วงข้อมูล B2:B10"],
      compatibility: ["Excel 365", "Google Sheets"],
      executionMode: "saved-output",
      input: { type: "table", columns: ["B"], rows: [[100], [1490]] },
      output: { type: "table", columns: ["Result"], rows: [[1590]] },
    });
    const artifacts = buildContentArtifacts([formula]);

    expect(artifacts.html).toContain("learning-example");
    expect(artifacts.html).toContain("<td>1590</td>");
    expect(artifacts.html).toContain("<h4>Input</h4>");
    expect(artifacts.html).not.toContain("<script>");
    expect(artifacts.plainText).toContain("=SUM(B2:B10)");
    expect(artifacts.plainText).toContain("1590");
  });

  it("rejects oversized saved output", () => {
    const parsed = contentBlockSchema.safeParse({
      id: "script-1",
      type: "automation-script",
      platform: "excel-vba",
      title: "Macro",
      code: "Sub Run(): End Sub",
      hostRequirements: [],
      executionMode: "saved-output",
      output: { type: "table", columns: ["value"], rows: Array.from({ length: 501 }, () => [1]) },
    });
    expect(parsed.success).toBe(false);
  });

  it("preserves executable runtime and dataset metadata in the stored reader block", () => {
    const block = contentBlockSchema.parse({
      id: "duckdb-1",
      type: "executable-code",
      language: "sql",
      dialect: "duckdb",
      executionMode: "saved-output",
      datasetId: "sales",
      datasetVersion: "1.0.0",
      datasetChecksum: "sha256:abc",
      runtimeVersion: "1.5.4",
      code: "SELECT 1 AS value",
      output: { type: "table", columns: ["value"], rows: [[1]] },
      executedAt: "2026-08-04T12:00:00.000Z",
    });
    expect(block).toMatchObject({ datasetId: "sales", datasetVersion: "1.0.0", runtimeVersion: "1.5.4" });
    expect(blockToMarkdown(block)).toContain("SELECT 1 AS value");
  });

  it("round-trips native BlockNote learning blocks without flattening metadata", () => {
    const source: ContentBlock[] = [{
      id: "native-sql",
      type: "executable-code",
      language: "sql",
      dialect: "sqlite",
      executionMode: "saved-output",
      datasetId: "inventory",
      datasetVersion: "1.0.0",
      datasetChecksum: "sha256:test",
      runtimeVersion: "sql.js-1.14.1",
      code: "SELECT * FROM inventory_items",
      output: { type: "table", columns: ["sku"], rows: [["A-100"]] },
      executedAt: "2026-08-04T12:00:00.000Z",
    }];
    const editorBlocks = readerBlocksToEditorBlocks(source) as Array<{ type: string; props: { data: string } }>;
    expect(editorBlocks[0].type).toBe("executableCode");
    expect(JSON.parse(editorBlocks[0].props.data)).toEqual(source[0]);
    expect(editorBlocksToReaderBlocks(editorBlocks)).toEqual(source);
  });

  it("migrates a flattened legacy code representation to a native learning block", () => {
    const learning: ContentBlock = { id: "legacy", type: "formula-example", engine: "dax", title: "Total", expression: "SUM(Sales[Amount])", prerequisites: [], compatibility: ["Power BI"], executionMode: "preview-only" };
    const merged = mergeLearningBlocksIntoEditorBlocks([{ id: "legacy", type: "codeBlock", props: { language: "dax" }, content: [] }], [learning]) as Array<{ type: string }>;
    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe("formulaExample");
  });

  it("routes every supported block type through the shared registry", () => {
    const blocks: ContentBlock[] = [
      { id: "p", type: "paragraph", text: "Paragraph" },
      { id: "h", type: "heading", level: 2, text: "Heading" },
      { id: "c", type: "callout", tone: "tip", title: "Tip", text: "Callout" },
      { id: "code", type: "code", language: "sql", code: "select 1" },
      { id: "toggle", type: "toggle", title: "More", text: "Details" },
      { id: "list", type: "list", items: ["One"] },
      { id: "run", type: "executable-code", language: "sql", dialect: "duckdb", executionMode: "saved-output", code: "select 1", output: { type: "text", value: "1" } },
      { id: "formula", type: "formula-example", engine: "dax", title: "Total", expression: "SUM(Sales[Amount])", prerequisites: [], compatibility: [], executionMode: "preview-only" },
      { id: "script", type: "automation-script", platform: "excel-vba", title: "Run", code: "Sub Run(): End Sub", hostRequirements: ["Excel"], executionMode: "preview-only" },
    ];

    for (const block of blocks) {
      expect(blockToPlainText(block)).not.toBe("");
      expect(blockToSafeHtml(block)).not.toBe("");
      expect(blockToMarkdown(block)).not.toBe("");
    }
  });
});
