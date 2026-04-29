"use client";

import { useRef, useState } from "react";

type SeoResult = {
  seo_score: number;
  issues: string[];
  suggestions: string[];
  optimized_title: string;
  optimized_content: string;
};

type PostEditorSeoPanelProps = {
  checkSeoAction: (input: {
    title: string;
    content: string;
    category: string;
  }) => Promise<SeoResult>;
};

export default function PostEditorSeoPanel({
  checkSeoAction,
}: PostEditorSeoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckSEO() {
    const form = panelRef.current?.closest("form");

    if (!form) {
      setError("Unable to find the post editor form.");
      return;
    }

    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const category = String(formData.get("category") ?? "Blog").trim() || "Blog";

    if (!title || !content) {
      setError("Title and content are required before checking SEO.");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const seoResult = await checkSeoAction({ title, content, category });
      setResult(seoResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to check SEO.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section
      ref={panelRef}
      className="grid gap-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">SEO Check</h3>
          <p className="mt-1 text-xs text-black/60 dark:text-white/60">
            Compare the current draft with AI-generated SEO recommendations. The
            original editor content will stay unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCheckSEO}
          disabled={isChecking}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-black"
        >
          {isChecking ? "Checking..." : "Check SEO"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-sm font-medium text-black/60 dark:text-white/60">
              SEO Score
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {result.seo_score}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Issues</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70 dark:text-white/70">
                {result.issues.length ? (
                  result.issues.map((issue) => <li key={issue}>{issue}</li>)
                ) : (
                  <li>No issues found.</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Suggestions</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70 dark:text-white/70">
                {result.suggestions.length ? (
                  result.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))
                ) : (
                  <li>No suggestions available.</li>
                )}
              </ul>
            </div>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">SEO Optimized Version</span>
            <textarea
              value={result.optimized_content}
              readOnly
              rows={12}
              className="w-full resize-y rounded-lg border border-black/15 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-white/20 dark:bg-black/20"
            />
          </label>
        </div>
      )}
    </section>
  );
}