import { NextResponse } from "next/server";
import { z } from "zod";
import { createMediaObjectKey, getStorageAdapter } from "@/core/media/storage";
import { detectImageType } from "@/core/media/validation";
import { getOwnerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTrustedOrigin } from "@/lib/request-security";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const metadataSchema = z.object({
  altText: z.string().trim().min(1).max(240),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]),
});

function maxUploadBytes() {
  const configured = Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880);
  return Number.isSafeInteger(configured) && configured > 0 ? Math.min(configured, 10_485_760) : 5_242_880;
}

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const rateLimit = await consumeRateLimit("media-upload", owner.id, 20, 60 * 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many uploads" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Invalid multipart form" }, { status: 400 }); }
  const file = formData.get("file");
  const metadata = metadataSchema.safeParse({ altText: formData.get("altText"), visibility: formData.get("visibility") });
  if (!(file instanceof File) || !metadata.success) return NextResponse.json({ error: "File and alt text are required" }, { status: 400 });
  if (file.size < 1 || file.size > maxUploadBytes()) return NextResponse.json({ error: "File is empty or too large" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageType(bytes);
  if (!mimeType) return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" }, { status: 415 });
  const objectKey = createMediaObjectKey(mimeType);
  const storage = getStorageAdapter();
  const stored = await storage.put(objectKey, bytes, mimeType);
  try {
    const media = await prisma.media.create({ data: {
      storageProvider: stored.provider, bucket: stored.bucket, objectKey: stored.objectKey, publicUrl: stored.publicUrl,
      mimeType, fileName: file.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || objectKey.split("/").pop()!,
      fileSize: file.size, altText: metadata.data.altText, visibility: metadata.data.visibility,
    } });
    await prisma.auditLog.create({ data: { userId: owner.id, action: "MEDIA_UPLOADED", entityType: "Media", entityId: media.id } });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    await storage.delete(stored.objectKey);
    console.error("Unable to save uploaded media", error);
    return NextResponse.json({ error: "Unable to save media" }, { status: 500 });
  }
}
