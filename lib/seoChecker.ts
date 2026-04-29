import { buildSeoPrompt } from "@/prompts/seoPrompt";
import { callAI } from "@/services/aiService";

type CheckSeoInput = {
  title: string;
  content: string;
  category: string;
};

type SeoCheckResult = {
  seo_score: number;
  issues: string[];
  suggestions: string[];
  optimized_title: string;
  optimized_content: string;
};

const invalidAIResponseFallback: SeoCheckResult = {
  seo_score: 0,
  issues: ["Invalid AI response"],
  suggestions: [],
  optimized_title: "",
  optimized_content: "",
};

export async function checkSEO({
  title,
  content,
  category,
}: CheckSeoInput): Promise<SeoCheckResult> {
  const prompt = buildSeoPrompt({ title, content, category });
  const model = process.env.OPTIMIZER_MODEL;

  if (!model) {
    throw new Error("OPTIMIZER_MODEL is not defined in environment variables");
  }

  console.log("Using AI model:", model);

  const response = await callAI({
    model: model,
    prompt: prompt,
  });

  console.log("RAW AI RESPONSE:", response);

  try {
    const jsonString = response.slice(
      response.indexOf("{"),
      response.lastIndexOf("}") + 1,
    );

    return JSON.parse(jsonString) as SeoCheckResult;
  } catch {
    console.log("RAW AI RESPONSE:", response);
    return invalidAIResponseFallback;
  }
}
