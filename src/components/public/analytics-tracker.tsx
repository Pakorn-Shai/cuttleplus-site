"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Privacy-friendly page view tracker.
 * Sends a lightweight POST to /api/analytics/track on each page navigation.
 * Does not collect IP, user agent, or any PII.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Avoid double-tracking in React strict mode
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Fire-and-forget — never block navigation
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || undefined }),
      // Low priority, no need to wait
      keepalive: true,
    }).catch(() => {
      // Silently ignore errors
    });
  }, [pathname]);

  return null;
}
