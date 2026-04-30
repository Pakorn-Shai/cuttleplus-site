"use client";

import { useRef, useState } from "react";

type SeoResult = {
  seo_score: number;
  issues: string[];
  suggestions: string[];
  optimized_title: string;
  optimized_content: string;
  title_feedback: string;
  image_feedback: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  meta_feedback: string;
};

type PostEditorSeoPanelProps = {
  checkSeoAction: (input: {
    title: string;
    content: string;
    category: string;
    coverImageUrl?: string | null;
  }) => Promise<SeoResult>;
  coverImageUrl?: string | null;
};

export default function PostEditorSeoPanel({
  checkSeoAction,
  coverImageUrl,
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
      const seoResult = await checkSeoAction({ title, content, category, coverImageUrl });
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
      className="grid gap-4 rounded-xl border border-border bg-surface-muted/50 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">SEO Check</h3>
          <p className="mt-1 text-xs text-muted">
            Compare the current draft with AI-generated SEO recommendations. The
            original editor content will stay unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCheckSEO}
          disabled={isChecking}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking ? "Checking..." : "Check SEO"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-4">
          <div>
            <p className="text-sm font-medium text-muted">
              SEO Score
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {result.seo_score}
            </p>
          </div>

          {result.title_feedback && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-900">Title (H1) Feedback</h4>
              <p className="mt-2 text-sm text-blue-800">{result.title_feedback}</p>
            </div>
          )}

          {result.image_feedback && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h4 className="font-semibold text-purple-900">Cover Image Feedback</h4>
              <p className="mt-2 text-sm text-purple-800">{result.image_feedback}</p>
            </div>
          )}

          {result.meta_feedback && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="font-semibold text-green-900">Meta Feedback</h4>
              <p className="mt-2 text-sm text-green-800">{result.meta_feedback}</p>
            </div>
          )}

          {/* Meta SEO Section */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h4 className="font-semibold">Meta SEO</h4>
            <p className="mt-1 text-xs text-muted">
              Copy the optimized meta tags for your post.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Slug</span>
                <input
                  type="text"
                  value={result.slug}
                  readOnly
                  className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-muted outline-none"
                  placeholder="e.g. my-seo-optimized-post"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Meta Title</span>
                <div className="relative">
                  <textarea
                    value={result.meta_title}
                    readOnly
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 pr-16 text-sm outline-none"
                    placeholder="Optimized meta title"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result.meta_title)}
                    className="absolute right-2 top-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Copy
                  </button>
                </div>
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="font-medium">Meta Description</span>
              <div className="relative">
                <textarea
                  value={result.meta_description}
                  readOnly
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 pr-16 text-sm outline-none"
                  placeholder="Optimized meta description"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.meta_description)}
                  className="absolute right-2 top-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  Copy
                </button>
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Issues</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {result.issues.length ? (
                  result.issues.map((issue) => <li key={issue}>{issue}</li>)
                ) : (
                  <li>No issues found.</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Suggestions</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
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

          {result.optimized_title && (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">SEO Optimized Title</span>
              <input
                type="text"
                value={result.optimized_title}
                readOnly
                className="w-full rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm outline-none"
              />
            </label>
          )}

          <label className="grid gap-2 text-sm">
            <span className="font-medium">SEO Optimized Content</span>
            <textarea
              value={result.optimized_content}
              readOnly
              rows={12}
              className="w-full resize-y rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>
      )}
    </section>
  );
}