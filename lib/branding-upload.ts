import crypto from "node:crypto";

export type BrandingUploadKind = "logo" | "favicon";

type ImageDimensions = {
  width: number;
  height: number;
};

export type BrandingUploadValidationResult =
  | { ok: true; dimensions?: ImageDimensions }
  | { ok: false; error: string };

export const logoUploadRules = {
  maxBytes: 1024 * 1024,
  allowedExtensions: ["png", "jpg", "jpeg", "webp", "svg"],
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  minWidth: 120,
  minHeight: 40,
  maxWidth: 1200,
  maxHeight: 400,
};

export const faviconUploadRules = {
  maxBytes: 256 * 1024,
  allowedExtensions: ["ico", "png"],
  allowedMimeTypes: ["image/x-icon", "image/vnd.microsoft.icon", "image/png"],
  allowedPngSizes: [32, 48, 180, 192, 512],
};

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  let offset = 2;

  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

export function readRasterImageDimensions(buffer: Buffer, extension: string) {
  if (extension === "png") return readPngDimensions(buffer);
  if (extension === "jpg" || extension === "jpeg") return readJpegDimensions(buffer);
  if (extension === "webp") return readWebpDimensions(buffer);
  return null;
}

export function validateBrandingUploadFile(file: File, buffer: Buffer, kind: BrandingUploadKind): BrandingUploadValidationResult {
  const extension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (kind === "logo") {
    if (file.size > logoUploadRules.maxBytes) {
      return { ok: false, error: "Logo file size must be 1MB or smaller." };
    }

    if (!logoUploadRules.allowedExtensions.includes(extension) || !logoUploadRules.allowedMimeTypes.includes(mimeType)) {
      return { ok: false, error: "Logo must be PNG, JPG, JPEG, WebP, or SVG." };
    }

    if (["png", "jpg", "jpeg", "webp"].includes(extension)) {
      const dimensions = readRasterImageDimensions(buffer, extension);
      if (!dimensions) return { ok: false, error: "Could not read logo image dimensions." };
      if (
        dimensions.width < logoUploadRules.minWidth ||
        dimensions.height < logoUploadRules.minHeight ||
        dimensions.width > logoUploadRules.maxWidth ||
        dimensions.height > logoUploadRules.maxHeight
      ) {
        return {
          ok: false,
          error: "Logo image must be 120-1200px wide and 40-400px high.",
        };
      }
      return { ok: true, dimensions };
    }

    return { ok: true };
  }

  if (file.size > faviconUploadRules.maxBytes) {
    return { ok: false, error: "Favicon file size must be 256KB or smaller." };
  }

  if (!faviconUploadRules.allowedExtensions.includes(extension) || !faviconUploadRules.allowedMimeTypes.includes(mimeType)) {
    return { ok: false, error: "Favicon must be ICO or PNG." };
  }

  if (extension === "png") {
    const dimensions = readPngDimensions(buffer);
    if (!dimensions) return { ok: false, error: "Could not read favicon PNG dimensions." };
    if (dimensions.width !== dimensions.height || !faviconUploadRules.allowedPngSizes.includes(dimensions.width)) {
      return { ok: false, error: "Favicon PNG must be square and one of 32, 48, 180, 192, or 512px." };
    }
    return { ok: true, dimensions };
  }

  return { ok: true };
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  return { cloudName, apiKey, apiSecret };
}

function createCloudinarySignature(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function uploadBrandingFileToCloudinary(file: File, buffer: Buffer, kind: BrandingUploadKind) {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Branding upload is not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_BRANDING_FOLDER ?? "cuttleplus/branding";
  const publicIdPrefix = `${kind}-${Date.now()}`;
  const signatureParams = {
    folder,
    public_id: publicIdPrefix,
    timestamp,
  };

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(buffer)], { type: file.type }), file.name);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("public_id", publicIdPrefix);
  formData.append("signature", createCloudinarySignature(signatureParams, config.apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const result = (await response.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };

  if (!response.ok || !result.secure_url) {
    throw new Error("Branding upload failed.");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id ?? null,
  };
}