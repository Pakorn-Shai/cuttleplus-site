import "server-only";

import { readabilitySuggestionSchema } from "./suggestion";
import { metadataSuggestionSchema } from "./metadata-suggestion";
import {
  registerProvider,
  type AIProvider,
  type ReadabilityRequest,
  type ReadabilityResult,
  type MetadataRequest,
  type MetadataResult,
} from "./provider";

export function getTyphoonModel() {
  return process.env.TYPHOON_MODEL || "typhoon-v2.5-30b-a3b-instruct";
}

function numberFromEnv(name: string, fallback: number, bounds: { min: number; max: number }) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= bounds.min && value <= bounds.max ? value : fallback;
}

function typhoonConfig() {
  const apiKey = process.env.TYPHOON_API_KEY;
  if (!apiKey) throw new Error("TYPHOON_NOT_CONFIGURED");
  return {
    apiKey,
    baseUrl: (process.env.TYPHOON_BASE_URL || "https://api.opentyphoon.ai/v1").replace(/\/$/, ""),
    model: getTyphoonModel(),
    timeoutMs: Math.floor(numberFromEnv("TYPHOON_TIMEOUT", 60_000, { min: 5_000, max: 300_000 })),
  };
}

// ── Typhoon provider implementation ─────────────────────────────────
//
// Typhoon (OpenTyphoon) exposes an OpenAI-compatible chat completions
// endpoint. Rather than relying on strict json_schema structured output
// (support varies between backends), we request json_object output, embed
// the target schema directly in the system prompt, and validate the parsed
// result with zod. If validation fails the caller's fallback chain takes
// over, so a malformed Typhoon response automatically degrades to the
// backup provider.

function createTyphoonProvider(): AIProvider {
  const config = typhoonConfig();

  async function chatCompletion(
    schema: Record<string, unknown>,
    systemPrompt: string,
    userContent: string,
    maxTokens: number,
  ) {
    const promptWithSchema = [
      systemPrompt,
      "Respond with a single valid JSON object only. Do not wrap it in markdown, do not add commentary.",
      `The JSON object must conform exactly to this JSON schema: ${JSON.stringify(schema)}`,
    ].join("\n");

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: promptWithSchema },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    if (!response.ok) throw new Error(`TYPHOON_${response.status}:${payload.error?.message ?? "Request failed"}`);
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("TYPHOON_EMPTY_RESPONSE");
    let decoded: unknown;
    try {
      decoded = JSON.parse(content);
    } catch {
      throw new Error("TYPHOON_INVALID_JSON");
    }
    return {
      decoded,
      model: payload.model ?? config.model,
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
    };
  }

  return {
    name: "typhoon",

    async checkConnection() {
      const { decoded, model } = await chatCompletion(
        { type: "object", properties: { status: { type: "string", enum: ["ok"] } }, required: ["status"], additionalProperties: false },
        "Return the requested diagnostic status. Do not include any other text.",
        "Return the requested diagnostic status. Do not include any other text.",
        64,
      );
      const parsed = decoded as { status?: unknown };
      if (parsed.status !== "ok") throw new Error("TYPHOON_INVALID_SCHEMA");
      return { model };
    },

    async requestReadabilitySuggestion(input: ReadabilityRequest): Promise<ReadabilityResult> {
      const { decoded, model, inputTokens, outputTokens } = await chatCompletion(
        input.responseSchema,
        input.systemPrompt,
        JSON.stringify({ title: input.title, excerpt: input.excerpt, blocks: input.blocks }),
        input.maxTokens,
      );
      const suggestion = readabilitySuggestionSchema.safeParse(decoded);
      if (!suggestion.success) throw new Error("TYPHOON_INVALID_SCHEMA");
      return { suggestion: suggestion.data, model, inputTokens, outputTokens };
    },

    async requestMetadataSuggestion(input: MetadataRequest): Promise<MetadataResult> {
      const { decoded, model, inputTokens, outputTokens } = await chatCompletion(
        input.responseSchema,
        input.systemPrompt,
        JSON.stringify({
          title: input.title,
          excerpt: input.excerpt,
          blocks: input.blocks,
          availableCategories: input.availableCategories,
          existingTags: input.existingTags,
        }),
        input.maxTokens,
      );
      const suggestion = metadataSuggestionSchema.safeParse(decoded);
      if (!suggestion.success) throw new Error("TYPHOON_INVALID_SCHEMA");
      return { suggestion: suggestion.data, model, inputTokens, outputTokens };
    },
  };
}

// Register the Typhoon provider
registerProvider("typhoon", createTyphoonProvider);

export async function checkTyphoonConnection() {
  const provider = createTyphoonProvider();
  return provider.checkConnection();
}