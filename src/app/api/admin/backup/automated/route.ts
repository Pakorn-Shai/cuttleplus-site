import { type NextRequest, NextResponse } from "next/server";
import { createSiteBackup, serializeSiteBackup } from "@/core/backup/service";
import { getOwnerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Scheduler secret must match SCHEDULER_SECRET env var, same as scheduled-publish.
// If not configured, only owner session can trigger automated backups.
function isAuthorized(request: NextRequest): boolean {
  const bearer = request.headers.get("authorization");
  const secret = process.env.SCHEDULER_SECRET;
  if (secret && bearer) {
    const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : bearer;
    // Timing-safe comparison
    let mismatch = 0;
    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(secret);
    const len = Math.max(tokenBuf.length, secretBuf.length);
    for (let i = 0; i < len; i++) {
      mismatch |= (tokenBuf[i] ?? 0) ^ (secretBuf[i] ?? 0);
    }
    return mismatch === 0;
  }
  return false;
}

// S3-compatible upload helper using @aws-sdk/client-s3
async function uploadToS3(
  bucket: string,
  key: string,
  body: string,
): Promise<void> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 credentials not configured");
  }

  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
      Metadata: {
        "backup-format": "knowledge-hub-backup",
        "backup-version": "1",
        "created-at": new Date().toISOString(),
      },
    }),
  );
}

export async function POST(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session && !isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const backup = await createSiteBackup();
    const serialized = serializeSiteBackup(backup);

    const timestamp = backup.createdAt.slice(0, 19).replace(/:/g, "-");
    const filename = `knowledge-hub-backup-${timestamp}.json`;
    const recordCount = Object.values(backup.counts).reduce(
      (sum, c) => sum + c,
      0,
    );

    // Upload to S3 if configured
    const backupBucket = process.env.BACKUP_S3_BUCKET;
    const backupPrefix = process.env.BACKUP_S3_PREFIX ?? "backups/";
    let s3Uploaded = false;
    let s3Key: string | null = null;

    if (backupBucket) {
      try {
        s3Key = `${backupPrefix}${filename}`;
        await uploadToS3(backupBucket, s3Key, serialized);
        s3Uploaded = true;
        logger.info("Automated backup uploaded to S3", {
          bucket: backupBucket,
          key: s3Key,
          recordCount,
        });
      } catch (s3Error) {
        logger.error(
          "Automated backup S3 upload failed",
          s3Error instanceof Error ? s3Error : undefined,
          { bucket: backupBucket },
        );
      }
    }

    // Store backup metadata in database for tracking
    await prisma.auditLog.create({
      data: {
        userId: session?.id ?? null,
        action: "AUTOMATED_BACKUP_CREATED",
        entityType: "System",
        entityId: null,
        metadataJson: {
          filename,
          recordCount,
          tableCounts: backup.counts,
          s3Uploaded,
          s3Key,
          durationMs: Date.now() - startTime,
          createdAt: backup.createdAt,
        },
      },
    });

    logger.info("Automated backup completed", {
      filename,
      recordCount,
      s3Uploaded,
      s3Key,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      filename,
      recordCount,
      tableCounts: backup.counts,
      s3Uploaded,
      s3Key,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown backup error";
    logger.error("Automated backup failed", error instanceof Error ? error : undefined);

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: "AUTOMATED_BACKUP_FAILED",
        entityType: "System",
        entityId: null,
        metadataJson: {
          error: errorMessage,
          durationMs: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
