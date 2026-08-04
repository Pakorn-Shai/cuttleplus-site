import { describe, expect, it } from "vitest";
import { assertLearningBlocksArePublicSafe, learningBlockPrivacyIssues } from "@/core/content/learning-privacy";
import type { LearningBlock } from "@/core/content/learning-blocks";

function script(code: string): LearningBlock {
  return { id: "script", type: "automation-script", platform: "google-apps-script", title: "Example", code, hostRequirements: [], executionMode: "preview-only" };
}

describe("learning block privacy validation", () => {
  it.each([
    ["API key", "const api_key = 'AIza123456789012345678901234567890';"],
    ["database credential", "postgresql://owner:real-password@db.internal/app"],
    ["private IP", "fetch('http://192.168.1.25/report')"],
    ["private key", "-----BEGIN PRIVATE KEY----- secret"],
  ])("detects %s", (_label, value) => {
    expect(learningBlockPrivacyIssues(script(value))).not.toEqual([]);
    expect(() => assertLearningBlocksArePublicSafe([script(value)])).toThrow("SENSITIVE_LEARNING_BLOCK");
  });

  it("allows obvious placeholders and deterministic examples", () => {
    expect(learningBlockPrivacyIssues(script("const api_key = 'YOUR_API_KEY';\nfetch('https://example.com/data')"))).toEqual([]);
  });
});
