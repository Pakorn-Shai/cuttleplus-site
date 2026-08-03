import { NextResponse } from "next/server";
import { createSiteBackup, serializeSiteBackup } from "@/core/backup/service";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rateLimit = await consumeRateLimit("database-backup", owner.id, 5, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "สร้าง backup ถี่เกินไป กรุณาลองใหม่ภายหลัง" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });

  const backup = await createSiteBackup();
  const date = backup.createdAt.slice(0, 10);
  return new NextResponse(serializeSiteBackup(backup), { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="knowledge-hub-backup-${date}.json"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
