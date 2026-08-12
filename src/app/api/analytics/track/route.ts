import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/core/analytics/service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { path?: string; referrer?: string };
    const path = body.path || request.headers.get("referer") || "/";
    const referrer = body.referrer || request.headers.get("referer") || undefined;

    await trackPageView(path, referrer);
    return NextResponse.json({ ok: true });
  } catch {
    // Silently fail — analytics should never break the user experience
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}