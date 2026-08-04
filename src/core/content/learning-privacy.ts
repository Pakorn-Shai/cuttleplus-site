import type { LearningBlock } from "./learning-blocks";

const sensitivePatterns = [
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/iu },
  { label: "AWS access key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/u },
  { label: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/u },
  { label: "Google API key", pattern: /\bAIza[A-Za-z0-9_-]{30,}\b/u },
  { label: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/u },
  { label: "credential in database URL", pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:/]+:[^\s@/]+@/iu },
  { label: "assigned secret", pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|secret)\s*[:=]\s*["'][^"'\n]{8,}["']/iu },
  { label: "private network address", pattern: /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|127\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/u },
];

export function learningBlockPrivacyIssues(block: LearningBlock) {
  const value = JSON.stringify(block).replace(/(?:YOUR|REPLACE|EXAMPLE|DUMMY|TEST|REDACTED)[_-][A-Z0-9_-]+/gu, "X");
  return sensitivePatterns.filter(({ pattern }) => pattern.test(value)).map(({ label }) => label);
}

export function assertLearningBlocksArePublicSafe(blocks: LearningBlock[]) {
  const issue = blocks.flatMap((block) => learningBlockPrivacyIssues(block).map((label) => ({ blockId: block.id, label })))[0];
  if (issue) throw new Error("SENSITIVE_LEARNING_BLOCK");
}
