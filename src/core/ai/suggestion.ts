import { z } from "zod";
import type { ContentBlock } from "@/core/content/types";

export const blockChangeSchema = z.object({
  blockId: z.string().min(1),
  replacementText: z.string().nullable(),
  replacementTitle: z.string().nullable(),
  replacementItems: z.array(z.string()).nullable(),
  reason: z.string().min(1).max(300),
});

export const readabilitySuggestionSchema = z.object({
  title: z.string().trim().min(1).max(240),
  excerpt: z.string().trim().max(500),
  summary: z.string().trim().min(1).max(600),
  changes: z.array(blockChangeSchema).max(100),
});

export type ReadabilitySuggestion = z.infer<typeof readabilitySuggestionSchema>;

export function applyReadabilitySuggestion(blocks: ContentBlock[], suggestion: ReadabilitySuggestion) {
  const changes = new Map(suggestion.changes.map((change) => [change.blockId, change]));
  return blocks.map((block) => {
    const change = changes.get(block.id);
    if (!change || block.type === "code") return block;
    if (block.type === "paragraph" || block.type === "heading") return change.replacementText === null ? block : { ...block, text: change.replacementText };
    if (block.type === "list") return change.replacementItems === null ? block : { ...block, items: change.replacementItems };
    return {
      ...block,
      title: change.replacementTitle ?? block.title,
      text: change.replacementText ?? block.text,
    };
  });
}
