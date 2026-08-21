import { NextResponse } from "next/server";
import { z } from "zod";
import { createTaxonomySuggestion } from "@/core/ai/taxonomy-service";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

const requestSchema = z.object({
  contentId: z.string().cuid(),
});

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const rateLimit = await consumeRateLimit("ai-suggestion", owner.id, 10, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "AI request limit reached" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid content" }, { status: 400 });

  try {
    return NextResponse.json({ suggestion: await createTaxonomySuggestion(parsed.data.contentId) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "CONTENT_NOT_FOUND") return NextResponse.json({ error: "Content not found" }, { status: 404 });
    if (message === "AI_BUDGET_EXCEEDED") return NextResponse.json({ error: "Monthly AI budget reached. Increase budget in Settings or wait for next month.", code: "budget_exceeded" }, { status: 429 });
    if (message === "AI_NO_PROVIDER_AVAILABLE" || message === "TYPHOON_NOT_CONFIGURED") return NextResponse.json({ error: "AI provider is not configured" }, { status: 503 });
    if (message.startsWith("TYPHOON_401") || message.startsWith("TYPHOON_403")) return NextResponse.json({ error: "AI provider API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน", code: "provider_auth" }, { status: 502 });
    if (message.startsWith("TYPHOON_429")) return NextResponse.json({ error: "AI provider จำกัดจำนวนคำขอชั่วคราว กรุณาลองใหม่ภายหลัง", code: "provider_rate_limit" }, { status: 503 });
    if (message === "TYPHOON_EMPTY_RESPONSE" || message === "TYPHOON_INVALID_JSON" || message === "TYPHOON_INVALID_SCHEMA") return NextResponse.json({ error: "AI ตอบกลับมาไม่ครบตามรูปแบบ กรุณาลองใหม่", code: "provider_response" }, { status: 502 });
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return NextResponse.json({ error: "AI provider ใช้เวลานานเกินค่า timeout", code: "provider_timeout" }, { status: 504 });
    console.error("Unable to generate taxonomy suggestion", error);
    return NextResponse.json({ error: "สร้าง taxonomy suggestion ไม่สำเร็จ", code: "provider_unknown" }, { status: 502 });
  }
}