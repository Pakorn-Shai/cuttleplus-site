"use client";

import { useState, useEffect } from "react";

interface CoverImagePreviewProps {
  imageUrl?: string | null;
}

export default function CoverImagePreview({ imageUrl }: CoverImagePreviewProps) {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const validateImage = async () => {
      if (!imageUrl || typeof imageUrl !== "string") {
        if (isMounted) {
          setIsValid(false);
          setIsLoading(false);
        }
        return;
      }

      // Check if URL is valid
      try {
        new URL(imageUrl);
      } catch {
        if (isMounted) {
          setIsValid(false);
          setIsLoading(false);
        }
        return;
      }

      // Test if image loads
      const img = new Image();
      img.onload = () => {
        if (isMounted) {
          setIsValid(true);
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        if (isMounted) {
          setIsValid(false);
          setIsLoading(false);
        }
      };
      img.src = imageUrl;
    };

    validateImage();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="rounded-lg border border-dashed border-black/20 bg-black/5 p-8 text-center dark:border-white/20 dark:bg-white/5">
        <p className="text-sm text-black/60 dark:text-white/60">
          No cover image set
        </p>
        <p className="mt-1 text-xs text-black/40 dark:text-white/40">
          Add a URL above to preview
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-black/15 bg-white/60 p-8 text-center dark:border-white/20 dark:bg-white/5">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs text-black/60 dark:text-white/60">
          Checking image...
        </p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          Invalid image URL
        </p>
        <p className="mt-1 text-xs text-red-700/70 dark:text-red-400/70">
          The URL &#34;{imageUrl}&#34; does not appear to be a valid image.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-black/15 bg-white/60 dark:border-white/20 dark:bg-white/5">
        <img
          src={imageUrl}
          alt="Cover preview"
          className="h-auto w-full object-cover"
          style={{ maxHeight: "300px" }}
          onError={() => setIsValid(false)}
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-black/60 dark:text-white/60">
          Image loaded successfully
        </span>
      </div>
    </div>
  );
}