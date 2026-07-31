import { describe, expect, it } from "vitest";
import { createSlug } from "@/core/content/slug";

describe("createSlug", () => {
  it("creates stable slugs from mixed content", () => {
    expect(createSlug("  SQL Window Functions: พื้นฐาน  ")).toBe("sql-window-functions-พื้นฐาน");
  });

  it("collapses punctuation and repeated separators", () => {
    expect(createSlug("Hello---World!!!")).toBe("hello-world");
  });
});