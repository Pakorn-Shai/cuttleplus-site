import { z } from "zod";
import type { ContentBlock } from "@/core/content/types";

export const blockChangeSchema = z.object({
  blockId: z.string().min(1),
  replacementText: z.string().nullable(),
  replacementTitle: z.string().nullable(),
  replacementItems: z.array(z.string()).nullable(),
  reason: z.string().min(1).max(300),
  locked: z.boolean().optional(),
});

export const readabilitySuggestionSchema = z.object({
  title: z.string().trim().min(1).max(240),
  excerpt: z.string().trim().max(500),
  summary: z.string().trim().min(1).max(600),
  changes: z.array(blockChangeSchema).max(100),
});

export type ReadabilitySuggestion = z.infer<typeof readabilitySuggestionSchema>;

const protectedBlockTypes = new Set(["code", "executable-code", "formula-example", "automation-script", "image", "embed"]);

export function applyReadabilitySuggestion(
  blocks: ContentBlock[],
  suggestion: ReadabilitySuggestion,
  options?: { blockIds?: string[] },
) {
  const allowedIds = options?.blockIds ? new Set(options.blockIds) : null;
  const changes = new Map(suggestion.changes.map((change) => [change.blockId, change]));
  return blocks.map((block) => {
    const change = changes.get(block.id);
    if (!change || protectedBlockTypes.has(block.type)) return block;
    // When blockIds is provided, only apply changes for those blocks
    if (allowedIds && !allowedIds.has(block.id)) return block;
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") return change.replacementText === null ? block : { ...block, text: change.replacementText };
    if (block.type === "list") return change.replacementItems === null ? block : { ...block, items: change.replacementItems };
    // Remaining: callout, toggle — both have title + text
    if (block.type === "callout" || block.type === "toggle") {
      return {
        ...block,
        title: change.replacementTitle ?? block.title,
        text: change.replacementText ?? block.text,
      };
    }
    return block;
  });
}

/** Returns the set of block IDs that have actual changes (replacement differs from original) */
export function changedBlockIds(suggestion: ReadabilitySuggestion): Set<string> {
  return new Set(suggestion.changes.map((c) => c.blockId));
}
