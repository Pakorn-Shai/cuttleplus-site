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
  coverImageUrl?: string | null;
};

const categoryInstructions: Record<SeoPromptCategory, string> = {
  learning:
    "Create a detailed, well-structured educational rewrite with clear headings, logical flow, and comprehensive explanations.",
  news:
    "Create a concise, clear rewrite that prioritizes timely information, readability, and direct language.",
  "review-products":
    "Create a persuasive rewrite focused on buyer intent, product benefits, comparison value, and conversion-oriented SEO.",
  worksheets:
    "Create an instructional rewrite with step-by-step clarity, practical guidance, and learner-friendly directions.",
  game:
    "Apply only minimal SEO improvements while keeping the content natural, simple, and user-focused.",
};

export function buildSeoPrompt({
  title,
  content,
  category,
  coverImageUrl,
}: BuildSeoPromptInput): string {
  const categoryInstruction =
    categoryInstructions[category as SeoPromptCategory] ??
    "Create a balanced SEO-optimized rewrite appropriate for the content type.";

  const hasCoverImage = Boolean(coverImageUrl && coverImageUrl.trim() !== "");

  const coverImageSection = hasCoverImage
    ? `Cover image URL: ${coverImageUrl}`
    : "Cover image URL: Not provided";

  return `You are a strict SEO expert. You MUST return valid JSON only.

Analyze the SEO quality of the following article.

Title (H1):
${title}

Content:
${content}

${coverImageSection}

Category:
${category}

Guidance:
${categoryInstruction}

--- ANALYSIS ---

1. TITLE (H1):
- Identify primary keyword from content
- Check keyword presence in title
- Check length (40–70 chars)
- Check keyword position (prefer early)
- Evaluate clarity and CTR
- Output: title_feedback

2. CONTENT:
- Keyword usage and distribution
- Structure (H2/H3 required)
- Readability and flow
- Depth and usefulness
- Output improvements in optimized_content

3. COVER IMAGE:
- Must exist (important SEO factor)
- Must be valid URL (http/https)
- If missing → penalize
- Output: image_feedback

4. META SEO:
- Generate meta_title (<= 60 chars, keyword included)
- Generate meta_description (120–160 chars, compelling, keyword included)
- Output: meta_feedback

5. SLUG:
- Generate SEO-friendly slug
- lowercase
- use hyphens
- include keyword
- no special characters

--- SCORING (STRICT) ---
- Title: 25
- Content: 55
- Image: 10
- Meta + Slug: 10

Rules:
- No image = subtract 10
- No keyword in title = heavy penalty
- No headings = reduce content score

--- OUTPUT FORMAT ---
Return ONLY valid JSON. No markdown. No explanation.

{
  "seo_score": number,
  "issues": string[],
  "suggestions": string[],
  "optimized_title": string,
  "optimized_content": string,
  "title_feedback": string,
  "image_feedback": string,
  "meta_title": string,
  "meta_description": string,
  "slug": string,
  "meta_feedback": string
}`;
}