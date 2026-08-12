import { NextResponse } from "next/server";
import { runSeoAudit } from "@/core/seo/audit";
import { getOwnerSession } from "@/lib/auth";

export async function GET() {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runSeoAudit();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to run SEO audit" }, { status: 500 });
  }
}