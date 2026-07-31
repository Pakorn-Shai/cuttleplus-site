import { describe, expect, it } from "vitest";
import { appearsInPublicListing, canOpenByPublicSlug } from "@/core/content/visibility";

describe("public content visibility", () => {
  it("keeps private, unlisted, and drafts out of public listings", () => {
    expect(appearsInPublicListing("PUBLISHED", "PUBLIC")).toBe(true);
    expect(appearsInPublicListing("PUBLISHED", "UNLISTED")).toBe(false);
    expect(appearsInPublicListing("PUBLISHED", "PRIVATE")).toBe(false);
    expect(appearsInPublicListing("DRAFT", "PUBLIC")).toBe(false);
  });

  it("allows published unlisted content by direct route but never private content", () => {
    expect(canOpenByPublicSlug("PUBLISHED", "PUBLIC")).toBe(true);
    expect(canOpenByPublicSlug("PUBLISHED", "UNLISTED")).toBe(true);
    expect(canOpenByPublicSlug("PUBLISHED", "PRIVATE")).toBe(false);
    expect(canOpenByPublicSlug("DRAFT", "PUBLIC")).toBe(false);
  });
});
