import { z } from "zod";

export const metadataSuggestionSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  suggestedCategory: z.string().trim().max(100).nullable(),
  suggestedTags: z.array(z.string().trim().max(100)).max(10),
  suggestedSeries: z.string().trim().max(200).nullable(),
  suggestedRelations: z.array(z.object({
    title: z.string().trim().max(240),
    reason: z.string().trim().max(300),
  })).max(10),
  suggestedInternalLinks: z.array(z.object({
    anchorText: z.string().trim().max(200),
    targetDescription: z.string().trim().max(500),
    reason: z.string().trim().max(300),
  })).max(10),
  suggestedContentType: z.enum([
    "QUICK_NOTE", "KNOWLEDGE_NOTE", "TUTORIAL", "ARTICLE",
    "CODE_SNIPPET", "TROUBLESHOOTING", "CHEAT_SHEET", "REFERENCE",
    "LEARNING_LOG", "PROJECT_NOTE", "CASE_STUDY", "CHECKLIST",
  ]).nullable(),
  suggestedSlug: z.string().trim().max(160).nullable(),
  suggestedMetaDescription: z.string().trim().max(300).nullable(),
  suggestedAltTexts: z.array(z.object({
    blockId: z.string().min(1),
    altText: z.string().trim().max(500),
  })).max(20),
});

export type MetadataSuggestion = z.infer<typeof metadataSuggestionSchema>;