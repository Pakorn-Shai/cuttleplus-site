export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fallbackSuffix(input: string) {
  const value = Array.from(input).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );

  return (value || Date.now()).toString(36).slice(-6);
}

export function normalizeSlug(input: string, fallbackPrefix = "item") {
  const normalized = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) {
    return normalized;
  }

  const safePrefix = fallbackPrefix
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";

  return `${safePrefix}-${fallbackSuffix(input)}`;
}

export function slugFromNameOrInput(name: string, slug: string, fallbackPrefix = "item") {
  return normalizeSlug(slug.trim() || name, fallbackPrefix);
}

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}