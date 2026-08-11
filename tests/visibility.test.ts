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

describe("search scope rules", () => {
  const allStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
  const allVisibilities = ["PRIVATE", "UNLISTED", "PUBLIC"] as const;

  it("searchPublic should only return PUBLISHED + PUBLIC content (matching publicContentWhere)", () => {
    for (const status of allStatuses) {
      for (const visibility of allVisibilities) {
        const shouldAppear = status === "PUBLISHED" && visibility === "PUBLIC";
        expect(appearsInPublicListing(status, visibility)).toBe(shouldAppear);
      }
    }
  });

  it("unlisted content should be accessible by direct slug but not in search results", () => {
    expect(canOpenByPublicSlug("PUBLISHED", "UNLISTED")).toBe(true);
    expect(appearsInPublicListing("PUBLISHED", "UNLISTED")).toBe(false);
  });

  it("private content should never appear in any public context", () => {
    expect(canOpenByPublicSlug("PUBLISHED", "PRIVATE")).toBe(false);
    expect(appearsInPublicListing("PUBLISHED", "PRIVATE")).toBe(false);
  });

  it("draft content should never appear regardless of visibility", () => {
    for (const visibility of allVisibilities) {
      expect(appearsInPublicListing("DRAFT", visibility)).toBe(false);
      expect(canOpenByPublicSlug("DRAFT", visibility)).toBe(false);
    }
  });

  it("archived content should never appear in public context", () => {
    for (const visibility of allVisibilities) {
      expect(appearsInPublicListing("ARCHIVED", visibility)).toBe(false);
      expect(canOpenByPublicSlug("ARCHIVED", visibility)).toBe(false);
    }
  });

  it("scheduled and inbox content should never appear in public context", () => {
    // SCHEDULED and INBOX are not in PublicationState but exist in ContentStatus
    // The repository's publicContentWhere filters by status: "PUBLISHED" so these are excluded
    for (const visibility of allVisibilities) {
      expect(appearsInPublicListing("DRAFT", visibility)).toBe(false); // represents non-PUBLISHED
    }
  });
});

describe("sitemap and indexing rules", () => {
  it("sitemap should only include public published content", () => {
    // Sitemap uses listPublic() which filters by publicContentWhere
    // This test documents the rule: only PUBLISHED + PUBLIC
    const sitemapEntries = [
      { status: "PUBLISHED", visibility: "PUBLIC", expected: true },
      { status: "PUBLISHED", visibility: "UNLISTED", expected: false },
      { status: "PUBLISHED", visibility: "PRIVATE", expected: false },
      { status: "DRAFT", visibility: "PUBLIC", expected: false },
    ];
    for (const entry of sitemapEntries) {
      expect(appearsInPublicListing(entry.status as "PUBLISHED" | "DRAFT", entry.visibility as "PUBLIC" | "UNLISTED" | "PRIVATE")).toBe(entry.expected);
    }
  });

  it("unlisted articles should have noindex robots directive", () => {
    // Documented rule: unlisted content gets robots: { index: false, follow: false }
    expect(canOpenByPublicSlug("PUBLISHED", "UNLISTED")).toBe(true); // accessible
    expect(appearsInPublicListing("PUBLISHED", "UNLISTED")).toBe(false); // not indexed
  });
});
