type SeoPromptCategory =
  | "learning"
  | "news"
  | "review-products"
  | "worksheets"
  | "game";

type BuildSeoPromptInput = {
  title: string;
  content: string;
  category: SeoPromptCategory | string;
};

const categoryInstructions: Record<SeoPromptCategory, string> = {
  learning:
    "Create a detailed, well-structured educational rewrite with clear headings, logical flow, and comprehensive explanations.",
  news: "Create a concise, clear rewrite that prioritizes timely information, readability, and direct language.",
  "review-products":
    "Create a persuasive rewrite focused on buyer intent, product benefits, comparison value, and conversion-oriented SEO.",
  worksheets:
    "Create an instructional rewrite with step-by-step clarity, practical guidance, and learner-friendly directions.",
  game: "Apply only minimal SEO improvements while keeping the content natural, simple, and user-focused.",
};

export function buildSeoPrompt({
  title,
  content,
  category,
}: BuildSeoPromptInput): string {
  const categoryInstruction =
    categoryInstructions[category as SeoPromptCategory] ??
    "Create a balanced SEO-optimized rewrite appropriate for the content type.";

  return `Analyze the SEO quality of the following content, identify issues, provide improvement suggestions, and rewrite it into an SEO-optimized version.

Original title:
${title}

Original content:
${content}

Category:
${category}

Category-specific guidance:
${categoryInstruction}

Requirements:
- Preserve the original meaning, facts, intent, and important details.
- Improve search visibility, clarity, readability, structure, and keyword relevance where appropriate.
- Do not invent facts, statistics, claims, sources, or product details that are not present in the original content.
- Adapt the SEO rewrite to the category-specific guidance above.
- Return valid JSON only. Do not include markdown, code fences, commentary, or any text outside the JSON object.

The JSON object must use exactly this shape:
{
  "seo_score": number,
  "issues": string[],
  "suggestions": string[],
  "optimized_title": string,
  "optimized_content": string
}`;
}