/**
 * Estimate AI cost from token usage.
 * Uses conservative pricing: $0.50/1M input tokens, $1.50/1M output tokens.
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 0.5 + (outputTokens / 1_000_000) * 1.5;
}