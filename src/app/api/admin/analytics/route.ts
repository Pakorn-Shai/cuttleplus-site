import { NextRequest, NextResponse } from "next/server";
import { getPageViewSummary } from "@/core/analytics/service";
import { getOwnerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const days = Number(request.nextUrl.searchParams.get("days") || 30);
    const summary = await getPageViewSummary(Math.min(Math.max(days, 1), 365));
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}