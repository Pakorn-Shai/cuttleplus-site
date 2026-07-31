"use client";

import { useMemo, useRef, useState } from "react";

type BrandingUploadKind = "logo" | "favicon";

type BrandingUploadFormProps = {
  kind: BrandingUploadKind;
  currentUrl: string | null;
  publicId: string | null;
};

const uploadCopy = {
  logo: {
    label: "Upload logo",
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    help: "Recommended logo: PNG/WebP/SVG, 240-600px wide, 80-200px high, max 1MB.",
    maxBytes: 1024 * 1024,
    allowedExtensions: ["png", "jpg", "jpeg", "webp", "svg"],
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
  favicon: {
    label: "Upload favicon",
    accept: "image/x-icon,image/vnd.microsoft.icon,image/png,.ico",
    help: "Recommended favicon: ICO 32x32 or PNG 512x512, square image, max 256KB.",
    maxBytes: 256 * 1024,
    allowedExtensions: ["ico", "png"],
    allowedMimeTypes: ["image/x-icon", "image/vnd.microsoft.icon", "image/png"],
  },
} as const;

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateFile(file: File, kind: BrandingUploadKind) {
  const rules = uploadCopy[kind];
  const extension = getExtension(file.name);

  if (file.size > rules.maxBytes) {
    return kind === "logo"
      ? "Logo file size must be 1MB or smaller."
      : "Favicon file size must be 256KB or smaller.";
  }

  if (!rules.allowedExtensions.includes(extension as never) || !rules.allowedMimeTypes.includes(file.type as never)) {
    return kind === "logo"
      ? "Logo must be PNG, JPG, JPEG, WebP, or SVG."
      : "Favicon must be ICO or PNG.";
  }

  return null;
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };

    image.src = url;
  });
}

async function validateImageDimensions(file: File, kind: BrandingUploadKind) {
  const extension = getExtension(file.name);

  if (kind === "logo" && ["png", "jpg", "jpeg", "webp"].includes(extension)) {
    const dimensions = await readImageDimensions(file);
    if (
      dimensions.width < 120 ||
      dimensions.height < 40 ||
      dimensions.width > 1200 ||
      dimensions.height > 400
    ) {
      return "Logo image must be 120-1200px wide and 40-400px high.";
    }
  }

  if (kind === "favicon" && extension === "png") {
    const dimensions = await readImageDimensions(file);
    const allowedSizes = [32, 48, 180, 192, 512];
    if (dimensions.width !== dimensions.height || !allowedSizes.includes(dimensions.width)) {
      return "Favicon PNG must be square and one of 32, 48, 180, 192, or 512px.";
    }
  }

  return null;
}

export function BrandingUploadForm({ kind, currentUrl, publicId }: BrandingUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackUrl = kind === "logo" ? "/logo.png" : "/favicon.ico";
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? fallbackUrl);
  const [hasUploadedUrl, setHasUploadedUrl] = useState(Boolean(currentUrl));
  const [uploadedPublicId, setUploadedPublicId] = useState(publicId);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const copy = uploadCopy[kind];

  const isImagePreview = useMemo(() => {
    if (!previewUrl) return false;
    return kind === "logo" || /\.(png|jpg|jpeg|webp|svg)$/i.test(previewUrl);
  }, [kind, previewUrl]);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    setError(null);
    setStatus(null);

    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    const basicError = validateFile(file, kind);
    if (basicError) {
      setError(basicError);
      return;
    }

    const dimensionError = await validateImageDimensions(file, kind).catch((dimensionReadError) =>
      dimensionReadError instanceof Error ? dimensionReadError.message : "Could not read image dimensions.",
    );

    if (dimensionError) {
      setError(dimensionError);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      const response = await fetch("/api/admin/theme/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { url?: string; publicId?: string | null; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed.");
      }

      setPreviewUrl(result.url);
      setHasUploadedUrl(true);
      setUploadedPublicId(result.publicId ?? null);
      setStatus(`${kind === "logo" ? "Logo" : "Favicon"} uploaded successfully.`);
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{kind === "logo" ? "Logo" : "Favicon"}</h2>
          <p className="mt-1 text-sm text-muted">{copy.help}</p>
        </div>
        {previewUrl && isImagePreview ? (
          <div className="rounded-lg border border-border bg-background p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Current ${kind}`}
              className={kind === "logo" ? "h-16 max-w-56 object-contain" : "h-12 w-12 object-contain"}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={copy.accept}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : copy.label}
        </button>
        {previewUrl ? (
          <p className="break-all text-xs text-muted">
            Current URL: <span className="font-mono">{hasUploadedUrl ? previewUrl : fallbackUrl}</span>
          </p>
        ) : (
          <p className="text-xs text-muted">No {kind} uploaded. The public site will use the existing fallback.</p>
        )}
        {uploadedPublicId ? (
          <p className="break-all text-xs text-muted">
            Cloudinary public ID: <span className="font-mono">{uploadedPublicId}</span>
          </p>
        ) : null}
        {status ? <p className="text-sm font-medium text-primary">{status}</p> : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}