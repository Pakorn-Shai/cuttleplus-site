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
};

const categories = ["General", "Blog", "News", "Tutorial", "Product"];

export default function SeoCheckerUI() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
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
      const seoResult = await checkSEO({ title, category, content });
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
    <section className="mx-auto w-full max-w-6xl space-y-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-950">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SEO Checker</h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
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
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5"
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
        <span className="text-sm font-medium">Content</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste or write your content here"
          rows={6}
          className="w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5"
        />
      </label>

      <button
        type="button"
        onClick={handleCheckSEO}
        disabled={isChecking || !content.trim()}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking ? "Checking..." : "Check SEO"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-semibold">Original content</h3>
          <textarea
            value={content}
            readOnly
            rows={14}
            className="w-full resize-none rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">SEO optimized content</h3>
            <div className="inline-flex rounded-lg border border-black/10 bg-gray-50 p-1 text-xs font-medium dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setOptimizedView("preview")}
                className={`rounded-md px-3 py-1.5 transition ${
                  optimizedView === "preview"
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300"
                    : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setOptimizedView("raw")}
                className={`rounded-md px-3 py-1.5 transition ${
                  optimizedView === "raw"
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300"
                    : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                }`}
              >
                Raw
              </button>
            </div>
          </div>

          {optimizedView === "preview" ? (
            <div className="min-h-[348px] rounded-lg border border-black/10 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5">
              {result?.optimized_content ? (
                <div className="prose max-w-none dark:prose-invert">
                  <ReactMarkdown>{result.optimized_content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-black/50 dark:text-white/50">
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
              className="w-full resize-none rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
          )}
        </div>
      </div>

      {result && (
        <div className="grid gap-4 rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-black/60 dark:text-white/60">
              SEO score
            </p>
            <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {result.seo_score}
            </p>
          </div>

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
      )}
    </section>
  );
}