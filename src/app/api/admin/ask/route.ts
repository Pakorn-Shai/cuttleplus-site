import { NextRequest, NextResponse } from "next/server";
import { askAssistant } from "@/core/ai/assistant";
import { getOwnerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { question?: string };
    if (!body.question || body.question.trim().length < 3) {
      return NextResponse.json({ error: "Question must be at least 3 characters" }, { status: 400 });
    }

    const result = await askAssistant(body.question.trim());
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "AI_BUDGET_EXCEEDED") {
      return NextResponse.json({ error: "AI budget exceeded for this month" }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}