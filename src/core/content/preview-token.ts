import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_HOURS = 24;

/**
 * Create a preview share token for a specific content item.
 * The token allows temporary access to private/unlisted content.
 */
export async function createPreviewToken(contentId: string, ttlHours = DEFAULT_TTL_HOURS): Promise<string> {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.deletedAt) throw new Error("CONTENT_NOT_FOUND");

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Store hashed token in SiteSetting for simplicity (single-owner system)
  await prisma.siteSetting.upsert({
    where: { key: `preview_token:${contentId}` },
    update: { valueJson: { tokenHash, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() } },
    create: { key: `preview_token:${contentId}`, valueJson: { tokenHash, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() } },
  });

  return token;
}

/**
 * Validate a preview share token and return the content ID if valid.
 */
export async function validatePreviewToken(token: string): Promise<string | null> {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // Find all preview tokens
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "preview_token:" } },
  });

  for (const row of rows) {
    const data = row.valueJson as { tokenHash?: string; expiresAt?: string } | null;
    if (!data || data.tokenHash !== tokenHash) continue;
    if (!data.expiresAt) continue;

    const expiresAt = new Date(data.expiresAt);
    if (expiresAt < new Date()) {
      // Clean up expired token
      await prisma.siteSetting.delete({ where: { key: row.key } }).catch(() => {});
      return null;
    }

    const contentId = row.key.replace("preview_token:", "");
    return contentId;
  }

  return null;
}

/**
 * Revoke all preview tokens for a content item.
 */
export async function revokePreviewTokens(contentId: string): Promise<void> {
  await prisma.siteSetting.delete({ where: { key: `preview_token:${contentId}` } }).catch(() => {});
}