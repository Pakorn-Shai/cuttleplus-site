"use client";

import { useState } from "react";

interface SeriesProgressProps {
  seriesSlug: string;
  totalItems: number;
  itemSlugs: string[];
}

function readVisited(seriesSlug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const key = `kh-series-${seriesSlug}`;
    const stored = JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
    return new Set(stored);
  } catch {
    return new Set();
  }
}

/**
 * Tracks which articles in a series have been visited.
 * Stores progress in localStorage — no server-side tracking needed for single-owner.
 */
export function SeriesProgress({ seriesSlug, totalItems, itemSlugs }: SeriesProgressProps) {
  const [visited] = useState<Set<string>>(() => readVisited(seriesSlug));

  const visitedCount = itemSlugs.filter((slug) => visited.has(slug)).length;
  const percentage = totalItems > 0 ? Math.round((visitedCount / totalItems) * 100) : 0;

  if (totalItems === 0) return null;

  return (
    <div className="series-progress" aria-label={`ความคืบหน้า: ${visitedCount} จาก ${totalItems} บท`}>
      <div className="series-progress-bar">
        <div
          className="series-progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="series-progress-text">
        {visitedCount} / {totalItems} บท ({percentage}%)
      </span>
    </div>
  );
}

/**
 * Mark an article as visited in a series.
 * Call this from the article page when viewing a series article.
 */
export function markSeriesArticleVisited(seriesSlug: string, itemSlug: string) {
  if (typeof window === "undefined") return;
  const key = `kh-series-${seriesSlug}`;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
    if (!stored.includes(itemSlug)) {
      stored.push(itemSlug);
      window.localStorage.setItem(key, JSON.stringify(stored));
    }
  } catch {
    // Silently fail
  }
}