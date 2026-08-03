import { NextResponse } from "next/server";
import { validateSiteBackup } from "@/core/backup/schema";
import { summarizeSiteBackup } from "@/core/backup/summary";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BACKUP_BYTES) return NextResponse.json({ error: "ไฟล์ Backup ต้องมีขนาดไม่เกิน 25 MB" }, { status: 413 });
  const rateLimit = await consumeRateLimit("backup-validation", owner.id, 20, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "ตรวจไฟล์ถี่เกินไป กรุณาลองใหม่ภายหลัง" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) return NextResponse.json({ error: "ไฟล์ Backup ต้องมีขนาดไม่เกิน 25 MB" }, { status: 413 });
  let decoded: unknown;
  try { decoded = JSON.parse(raw); } catch { return NextResponse.json({ error: "ไฟล์ไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 }); }
  const backup = validateSiteBackup(decoded);
  if (!backup.success) return NextResponse.json({ error: "รูปแบบหรือ version ของ Backup ไม่รองรับ" }, { status: 422 });
  return NextResponse.json({ status: "valid", summary: summarizeSiteBackup(backup.data), warnings: backup.data.includesMediaFiles ? [] : ["ไฟล์รูปจริงใน object storage ไม่ได้รวมอยู่ใน Backup นี้"] });
}
