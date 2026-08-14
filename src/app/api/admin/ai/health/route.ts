import { NextResponse } from "next/server";
import { withFallback } from "@/core/ai/provider";
// Side-effect imports register the providers in the registry.
import "@/core/ai/openrouter";
import "@/core/ai/typhoon";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const rateLimit = await consumeRateLimit("ai-health", owner.id, 10, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "ทดสอบการเชื่อมต่อถี่เกินไป" }, { status: 429 });
  try {
    // Try the configured primary provider first, then the fallback.
    const { result, provider } = await withFallback((p) => p.checkConnection());
    return NextResponse.json({ status: "ok", provider, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "AI_NO_PROVIDER_AVAILABLE") return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า AI provider" }, { status: 503 });
    if (message === "TYPHOON_NOT_CONFIGURED") return NextResponse.json({ error: "ยังไม่ได้ตั้ง TYPHOON_API_KEY" }, { status: 503 });
    if (message === "OPENROUTER_NOT_CONFIGURED") return NextResponse.json({ error: "ยังไม่ได้ตั้ง OPENROUTER_API_KEY" }, { status: 503 });
    if (message.startsWith("TYPHOON_401") || message.startsWith("TYPHOON_403")) return NextResponse.json({ error: "Typhoon API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน" }, { status: 502 });
    if (message.startsWith("OPENROUTER_401") || message.startsWith("OPENROUTER_403")) return NextResponse.json({ error: "OpenRouter API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน" }, { status: 502 });
    if (message.startsWith("OPENROUTER_402")) return NextResponse.json({ error: "OpenRouter credits ไม่เพียงพอ" }, { status: 502 });
    if (message.startsWith("TYPHOON_404") || message.startsWith("OPENROUTER_404")) return NextResponse.json({ error: "Model หรือ parameter ที่ตั้งไว้ไม่รองรับ" }, { status: 502 });
    if (message.startsWith("TYPHOON_429") || message.startsWith("OPENROUTER_429")) return NextResponse.json({ error: "Provider จำกัดจำนวนคำขอชั่วคราว" }, { status: 503 });
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return NextResponse.json({ error: "AI provider ใช้เวลานานเกินไป" }, { status: 504 });
    return NextResponse.json({ error: "ตรวจ AI provider ไม่สำเร็จ" }, { status: 502 });
  }
}