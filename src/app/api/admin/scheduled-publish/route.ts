import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { publishDueScheduledContent } from "@/core/content/scheduler";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Cron endpoint that publishes content whose `scheduledAt` has passed.
 *
 * Authentication is one of:
 *   1. A valid owner session (manual trigger from the admin), or
 *   2. `Authorization: Bearer <SCHEDULER_SECRET>` for external cron callers
 *      (Vercel Cron, GitHub Actions, system cron, etc.).
 *
 * The job is idempotent, so it is safe to invoke frequently; a content item
 * can only ever be published once regardless of how many times this runs.
 */

function tokenMatches(supplied: string, expected: string): boolean {
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  const secret = process.env.SCHEDULER_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const authorizedByToken = Boolean(secret && bearerToken && tokenMatches(bearerToken, secret));

  if (!owner && !authorizedByToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = owner?.id ?? "scheduler-cron";
  const rateLimit = await consumeRateLimit("scheduled-publish", identity, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "เรียก scheduler ถี่เกินไป กรุณาลองใหม่ภายหลัง" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  }

  try {
    const summary = await publishDueScheduledContent();
    return NextResponse.json({ status: "ok", summary });
  } catch {
    return NextResponse.json({ error: "Scheduler ล้มเหลว กรุณาลองใหม่หรือตรวจ log" }, { status: 500 });
  }
}