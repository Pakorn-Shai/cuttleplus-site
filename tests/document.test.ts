import { describe, expect, it } from "vitest";
import { blocksToSafeHtml, buildContentArtifacts } from "@/core/content/document";
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
});
