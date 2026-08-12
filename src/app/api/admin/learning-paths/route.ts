import { NextResponse } from "next/server";
import { generateLearningSummary, suggestLearningPaths } from "@/core/ai/learning-paths";
import { getOwnerSession } from "@/lib/auth";

export async function GET() {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [summary, paths] = await Promise.all([
      generateLearningSummary(1).catch(() => null),
      suggestLearningPaths(),
    ]);

    return NextResponse.json({
      summary: summary || {
        period: "N/A",
        totalContent: 0,
        categories: [],
        topTags: [],
        summary: "Unable to generate learning summary.",
        suggestedNextTopics: [],
      },
      paths,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load learning paths" }, { status: 500 });
  }
}