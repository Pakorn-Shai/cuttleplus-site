import { createHash } from "node:crypto";

export interface SuggestionContentSnapshot {
  title: string;
  excerpt: string | null;
  contentJson: unknown;
}

export function contentSnapshotHash(input: SuggestionContentSnapshot) {
  return createHash("sha256").update(JSON.stringify({
    title: input.title,
    excerpt: input.excerpt,
    contentJson: input.contentJson,
  })).digest("hex");
}

export function legacyContentSnapshotHash(input: object) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function matchesOriginalSuggestionSnapshot(
  content: SuggestionContentSnapshot,
  originalJson: unknown,
) {
  if (!originalJson || typeof originalJson !== "object" || Array.isArray(originalJson)) return false;
  if (!content.contentJson || typeof content.contentJson !== "object" || Array.isArray(content.contentJson)) return false;

  const original = originalJson as { title?: unknown; excerpt?: unknown; blocks?: unknown };
  const current = content.contentJson as { readerBlocks?: unknown };
  return original.title === content.title
    && original.excerpt === (content.excerpt ?? "")
    && Array.isArray(original.blocks)
    && Array.isArray(current.readerBlocks)
    && JSON.stringify(original.blocks) === JSON.stringify(current.readerBlocks);
}
