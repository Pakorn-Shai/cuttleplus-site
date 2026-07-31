export type ContentVisibility = "private" | "unlisted" | "public";
export type ContentStatus = "inbox" | "draft" | "published" | "archived";
export type ContentKind = "Tutorial" | "Knowledge Note" | "Code Snippet" | "Learning Log";

export type ContentBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "callout"; tone: "note" | "tip" | "warning"; title: string; text: string }
  | { id: string; type: "code"; language: string; filename?: string; code: string }
  | { id: string; type: "toggle"; title: string; text: string; open?: boolean }
  | { id: string; type: "list"; items: string[] };

export interface CategorySummary {
  name: string;
  slug: string;
  color: string;
  icon: string;
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
  featured?: boolean;
  blocks: ContentBlock[];
}
