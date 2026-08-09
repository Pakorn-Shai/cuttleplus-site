"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";

/**
 * Global error boundary shown when a Server Component or page-level
 * rendering fails. The `digest` field is a stable, deterministic hash
 * that can be correlated with server-side logs without leaking the
 * full stack trace to the client.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Log the structured error to the browser console for developer tools.
  useEffect(() => {
    console.error("[ErrorBoundary]", {
      message: error.message,
      digest: error.digest,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  const handleCopyDetails = async () => {
    const details = [
      `Error: ${error.message}`,
      error.digest ? `Digest: ${error.digest}` : "",
      `Time: ${new Date().toISOString()}`,
      `URL: ${typeof window !== "undefined" ? window.location.href : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available – silent fallback.
    }
  };

  return (
    <main
      className="empty-state"
      style={{ minHeight: "100vh", display: "grid", placeContent: "center", border: 0 }}
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle size={44} aria-hidden="true" />
      <h1>เกิดข้อผิดพลาดในการโหลดหน้า</h1>
      <p>ข้อมูลของคุณยังไม่ถูกเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง</p>
      {error.digest && (
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          Error reference: <code>{error.digest}</code>
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="primary-button" onClick={reset}>
          ลองใหม่
        </button>
        <button
          className="secondary-button"
          onClick={handleCopyDetails}
          type="button"
          aria-label="คัดลอกรายละเอียดข้อผิดพลาด"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "คัดลอกแล้ว" : "คัดลอกรายละเอียด"}
        </button>
      </div>
    </main>
  );
}