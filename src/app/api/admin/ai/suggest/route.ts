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
    if (message.startsWith("OPENROUTER_401") || message.startsWith("OPENROUTER_403")) return NextResponse.json({ error: "OpenRouter API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน", code: "provider_auth" }, { status: 502 });
    if (message.startsWith("OPENROUTER_402")) return NextResponse.json({ error: "OpenRouter credits ไม่เพียงพอ", code: "provider_credits" }, { status: 502 });
    if (message.startsWith("OPENROUTER_404")) return NextResponse.json({ error: "Model หรือ parameter ที่ตั้งไว้ไม่รองรับบน OpenRouter", code: "provider_model" }, { status: 502 });
    if (message.startsWith("OPENROUTER_429")) return NextResponse.json({ error: "OpenRouter จำกัดจำนวนคำขอชั่วคราว กรุณาลองใหม่ภายหลัง", code: "provider_rate_limit" }, { status: 503 });
    if (message === "OPENROUTER_EMPTY_RESPONSE" || message === "OPENROUTER_INVALID_JSON" || message === "OPENROUTER_INVALID_SCHEMA") return NextResponse.json({ error: "AI ตอบกลับมาไม่ครบตามรูปแบบ กรุณาลองใหม่", code: "provider_response" }, { status: 502 });
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return NextResponse.json({ error: "OpenRouter ใช้เวลานานเกินค่า AI_TIMEOUT", code: "provider_timeout" }, { status: 504 });
    console.error("Unable to generate AI suggestion", error);
    return NextResponse.json({ error: "สร้าง AI suggestion ไม่สำเร็จ กรุณาตรวจงานล่าสุด", code: "provider_unknown" }, { status: 502 });
  }
}
