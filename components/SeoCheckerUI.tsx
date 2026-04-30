"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { checkSEO } from "@/lib/seoChecker";

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

const categories = ["General", "Blog", "News", "Tutorial", "Product"];

export default function SeoCheckerUI() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [result, setResult] = useState<SeoResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [optimizedView, setOptimizedView] = useState<"preview" | "raw">(
    "preview",
  );

  async function handleCheckSEO() {
    setIsChecking(true);
    setError("");

    try {
      const seoResult = await checkSEO({ title, category, content, coverImageUrl: coverImageUrl || null });
      setResult(seoResult);
      setOptimizedView("preview");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to check SEO.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SEO Checker</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your content details, then generate SEO recommendations and an
          optimized version.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter a title"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Cover Image URL (optional)</span>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(event) => setCoverImageUrl(event.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Content</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste or write your content here"
          rows={6}
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <button
        type="button"
        onClick={handleCheckSEO}
        disabled={isChecking || !content.trim()}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking ? "Checking..." : "Check SEO"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-4 rounded-xl border border-border bg-surface-muted p-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-muted">
              SEO score
            </p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {result.seo_score}
            </p>
          </div>

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
      )}

      {result && (result.title_feedback || result.image_feedback || result.meta_feedback) && (
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-lg font-semibold">Meta SEO</h3>
          <p className="mt-1 text-sm text-muted">
            Review and copy the optimized meta tags for your content.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Slug</span>
              <input
                type="text"
                value={result.slug}
                readOnly
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-muted outline-none"
                placeholder="e.g. my-seo-optimized-post"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Title</span>
              </div>
              <div className="space-y-2">
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
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
            </div>
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
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-semibold">Original content</h3>
          <textarea
            value={content}
            readOnly
            rows={14}
            className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">SEO optimized content</h3>
            <div className="inline-flex rounded-lg border border-border bg-surface-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setOptimizedView("preview")}
                className={`rounded-md px-3 py-1.5 transition ${
                  optimizedView === "preview"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setOptimizedView("raw")}
                className={`rounded-md px-3 py-1.5 transition ${
                  optimizedView === "raw"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Raw
              </button>
            </div>
          </div>

          {optimizedView === "preview" ? (
            <div className="min-h-[348px] rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm outline-none">
              {result?.optimized_content ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{result.optimized_content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted">
                  Optimized content will appear here after checking SEO.
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={result?.optimized_content ?? ""}
              readOnly
              rows={14}
              placeholder="Optimized content will appear here after checking SEO."
              className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none"
            />
          )}
        </div>
      </div>
    </section>
  );
}