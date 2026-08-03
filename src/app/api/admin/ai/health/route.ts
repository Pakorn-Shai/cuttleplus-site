import { NextResponse } from "next/server";
import { checkOpenRouterConnection } from "@/core/ai/openrouter";
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
    return NextResponse.json({ status: "ok", ...(await checkOpenRouterConnection()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "OPENROUTER_NOT_CONFIGURED") return NextResponse.json({ error: "ยังไม่ได้ตั้ง OPENROUTER_API_KEY" }, { status: 503 });
    if (message.startsWith("OPENROUTER_401") || message.startsWith("OPENROUTER_403")) return NextResponse.json({ error: "OpenRouter API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน" }, { status: 502 });
    if (message.startsWith("OPENROUTER_402")) return NextResponse.json({ error: "OpenRouter credits ไม่เพียงพอ" }, { status: 502 });
    if (message.startsWith("OPENROUTER_404")) return NextResponse.json({ error: "Model หรือ parameter ที่ตั้งไว้ไม่รองรับ" }, { status: 502 });
    if (message.startsWith("OPENROUTER_429")) return NextResponse.json({ error: "OpenRouter จำกัดจำนวนคำขอชั่วคราว" }, { status: 503 });
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return NextResponse.json({ error: "OpenRouter timeout" }, { status: 504 });
    return NextResponse.json({ error: "ตรวจ OpenRouter ไม่สำเร็จ" }, { status: 502 });
  }
}
