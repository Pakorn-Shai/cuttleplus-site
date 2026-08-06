import type { z } from "zod";
import type { contentBlockSchema, structuredOutputSchema } from "./blocks/schema";

export type ContentVisibility = "private" | "unlisted" | "public";
export type ContentStatus = "inbox" | "draft" | "scheduled" | "published" | "archived";
export type ContentKind = "Quick Note" | "Knowledge Note" | "Tutorial" | "Article" | "Code Snippet" | "Troubleshooting" | "Cheat Sheet" | "Reference" | "Learning Log" | "Project Note" | "Case Study" | "Checklist";

export type StructuredOutput = z.infer<typeof structuredOutputSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;

export interface CategorySummary {
  name: string;
  slug: string;
  color: string;
  icon: string;
}

export interface TagSummary {
  name: string;
  slug: string;
  description: string;
  contentCount: number;
}

export interface SeriesSummary {
  name: string;
  slug: string;
  description: string;
  contentCount: number;
}

export interface SeriesDetail extends SeriesSummary {
  visibility: "public" | "unlisted";
  items: KnowledgeContent[];
}

export interface SeriesNavigation {
  name: string;
  slug: string;
  position: number;
  total: number;
  previous?: { title: string; slug: string };
  next?: { title: string; slug: string };
}

export interface CollectionSummary {
  name: string;
  slug: string;
  description: string;
  contentCount: number;
}

export interface CollectionDetail extends CollectionSummary {
  visibility: "public" | "unlisted";
  items: Array<{ content: KnowledgeContent; note: string }>;
}

export interface KnowledgeContent {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  type: ContentKind;
  status: ContentStatus;
  visibility: ContentVisibility;
  category: CategorySummary;
  tags: string[];
  readingTime: number;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  featured?: boolean;
  blocks: ContentBlock[];
  headings: { id: string; level: 2 | 3; text: string }[];
}
