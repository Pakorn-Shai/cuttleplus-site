export type BlogPlaceholderPost = {
  slug: string;
  title: string;
  excerpt: string;
};

export const BLOG_PLACEHOLDER_POSTS: BlogPlaceholderPost[] = [
  {
    slug: "welcome-to-cuttleplus-blog",
    title: "Welcome to the CuttlePlus Blog",
    excerpt:
      "This is a sample post placeholder for the upcoming CMS-driven blog index and detail experience.",
  },
  {
    slug: "content-workflow-preview",
    title: "Content Workflow Preview",
    excerpt:
      "A temporary route preview for future editorial workflows, drafts, and publishing status.",
  },
  {
    slug: "seo-structure-blueprint",
    title: "SEO Structure Blueprint",
    excerpt:
      "Reserved placeholder content to validate URL and metadata strategy before real data wiring.",
  },
];

export function getPlaceholderPostBySlug(slug: string): BlogPlaceholderPost | null {
  return BLOG_PLACEHOLDER_POSTS.find((post) => post.slug === slug) ?? null;
}
