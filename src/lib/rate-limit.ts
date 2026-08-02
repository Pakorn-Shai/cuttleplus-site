import "server-only";

import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

interface RateLimitRow {
  count: number;
  expiresAt: Date;
}

export async function consumeRateLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return { allowed: false, retryAfter: windowSeconds };
  const key = `${scope}:${createHmac("sha256", secret).update(identity).digest("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const [row] = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now} ELSE "RateLimitBucket"."windowStart" END,
      "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "RateLimitBucket"."expiresAt" END
    RETURNING "count", "expiresAt"
  `;
  return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)) };
}

export function requestClientAddress(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
