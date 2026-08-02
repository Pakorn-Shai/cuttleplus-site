import { NextResponse } from "next/server";
import { z } from "zod";
import { createReadabilitySuggestion } from "@/core/ai/service";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

const requestSchema = z.object({ contentId: z.string().cuid() });

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const rateLimit = await consumeRateLimit("ai-suggestion", owner.id, 10, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "AI request limit reached" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  try {
    return NextResponse.json({ suggestion: await createReadabilitySuggestion(parsed.data.contentId) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "CONTENT_NOT_FOUND") return NextResponse.json({ error: "Content not found" }, { status: 404 });
    if (message === "OPENROUTER_NOT_CONFIGURED") return NextResponse.json({ error: "OpenRouter is not configured" }, { status: 503 });
    console.error("Unable to generate AI suggestion", error);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 502 });
  }
}
