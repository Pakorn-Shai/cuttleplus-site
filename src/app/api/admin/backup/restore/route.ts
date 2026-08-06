import { NextResponse } from "next/server";
import { validateSiteBackup } from "@/core/backup/schema";
import { executeRestore, planRestore, validateBackupIntegrity } from "@/core/backup/restore";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

interface RestoreRequestBody {
  backup?: unknown;
  dryRun?: boolean;
}

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BACKUP_BYTES) return NextResponse.json({ error: "ไฟล์ Backup ต้องมีขนาดไม่เกิน 25 MB" }, { status: 413 });

  let body: RestoreRequestBody;
  try {
    body = await request.json() as RestoreRequestBody;
  } catch {
    return NextResponse.json({ error: "คำขอไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
  }

  const dryRun = body.dryRun !== false;
  const rateLimit = await consumeRateLimit(
    dryRun ? "backup-restore-plan" : "backup-restore-execute",
    owner.id,
    dryRun ? 20 : 3,
    60 * 60,
  );
  if (!rateLimit.allowed) return NextResponse.json({ error: "ดำเนินการ Restore ถี่เกินไป กรุณาลองใหม่ภายหลัง" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });

  const parsed = validateSiteBackup(body.backup);
  if (!parsed.success) return NextResponse.json({ error: "รูปแบบหรือ version ของ Backup ไม่รองรับ" }, { status: 422 });
  const backup = parsed.data;

  const issues = validateBackupIntegrity(backup);
  if (issues.length > 0) {
    return NextResponse.json({ error: "Backup มีข้อมูลอ้างอิงไม่ครบถ้วน", issues }, { status: 422 });
  }

  if (dryRun) {
    const plan = await planRestore(backup);
    return NextResponse.json({ status: "plan", plan });
  }

  try {
    const result = await executeRestore(backup, owner.id);
    return NextResponse.json({
      status: "restored",
      restoredAt: result.restoredAt,
      backupCreatedAt: result.backupCreatedAt,
      inserted: result.inserted,
      preRestoreBackupJson: result.preRestoreBackupJson,
    });
  } catch {
    return NextResponse.json({ error: "Restore ล้มเหลว ระบบย้อนกลับทั้งหมดแล้ว กรุณาลองใหม่หรือตรวจไฟล์ Backup" }, { status: 500 });
  }
}