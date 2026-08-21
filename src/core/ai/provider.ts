import "server-only";

import type { ReadabilitySuggestion } from "./suggestion";
import type { MetadataSuggestion } from "./metadata-suggestion";
import type { ContentBlock } from "@/core/content/types";

// ── Provider interface ──────────────────────────────────────────────

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface ReadabilityRequest {
  title: string;
  excerpt: string;
  blocks: ContentBlock[];
  mode: string;
  action: string;
  maxTokens: number;
  systemPrompt: string;
  responseSchema: Record<string, unknown>;
}

export interface ReadabilityResult {
  suggestion: ReadabilitySuggestion;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface MetadataRequest {
  title: string;
  excerpt: string;
  blocks: ContentBlock[];
  availableCategories: string[];
  existingTags: string[];
  maxTokens: number;
  systemPrompt: string;
  responseSchema: Record<string, unknown>;
}

export interface MetadataResult {
  suggestion: MetadataSuggestion;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIProvider {
  readonly name: string;
  checkConnection(): Promise<{ model: string }>;
  requestReadabilitySuggestion(input: ReadabilityRequest): Promise<ReadabilityResult>;
  requestMetadataSuggestion(input: MetadataRequest): Promise<MetadataResult>;
}

// ── Provider registry ───────────────────────────────────────────────

const providers = new Map<string, () => AIProvider>();

export function registerProvider(name: string, factory: () => AIProvider) {
  providers.set(name, factory);
}

export function getProvider(name?: string): AIProvider {
  const key = name ?? "typhoon";
  const factory = providers.get(key);
  if (!factory) throw new Error(`AI_PROVIDER_NOT_FOUND:${key}`);
  return factory();
}

/** Name of the configured primary provider (used for job bookkeeping). */
export function getPrimaryProviderName(): string {
  return "typhoon";
}
