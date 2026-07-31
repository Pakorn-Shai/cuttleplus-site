"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorksheetGrid } from "./worksheet-grid";

type WorksheetSubcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
};

type WorksheetCategory = {
  id: number;
  name: string;
  slug: string;
  subcategories: WorksheetSubcategory[];
};

type WorksheetCard = {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  category: {
    name: string;
    slug: string;
  } | null;
  subcategory: {
    name: string;
    slug: string;
  } | null;
};

type WorksheetBrowserProps = {
  categories: WorksheetCategory[];
  worksheets: WorksheetCard[];
  selectedCategorySlug?: string;
  selectedSubcategorySlug?: string;
  emptyMessage?: string;
};

export function WorksheetBrowser({
  categories,
  worksheets,
  selectedCategorySlug,
  selectedSubcategorySlug,
  emptyMessage,
}: WorksheetBrowserProps) {
  const router = useRouter();
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);
  const subjectOptions = selectedCategory?.subcategories ?? [];

  return (
    <>
      {categories.length > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-surface/60 p-4">
          <h2 className="text-sm font-semibold">Browse by category</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/worksheets"
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                !selectedCategorySlug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
            >
              All worksheets
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/worksheets/${category.slug}`}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  category.slug === selectedCategorySlug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {selectedCategory && subjectOptions.length > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-surface/60 p-4">
          <h2 className="text-sm font-semibold">Browse {selectedCategory.name} by subject</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/worksheets/${selectedCategory.slug}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                !selectedSubcategorySlug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
            >
              All subjects
            </Link>
            {subjectOptions.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/worksheets/${selectedCategory.slug}/${subcategory.slug}`}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  subcategory.slug === selectedSubcategorySlug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {subcategory.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-surface/60 p-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">ชั้นเรียน</span>
          <select
            value={selectedCategorySlug ?? ""}
            onChange={(event) => {
              const categorySlug = event.target.value;
              router.push(categorySlug ? `/worksheets/${categorySlug}` : "/worksheets");
            }}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">ทุกชั้นเรียน</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">วิชา</span>
          <select
            value={selectedCategory ? selectedSubcategorySlug ?? "" : ""}
            onChange={(event) => {
              const subcategorySlug = event.target.value;

              if (!selectedCategory) {
                return;
              }

              router.push(
                subcategorySlug
                  ? `/worksheets/${selectedCategory.slug}/${subcategorySlug}`
                  : `/worksheets/${selectedCategory.slug}`
              );
            }}
            disabled={!selectedCategory}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">ทุกวิชา</option>
            {subjectOptions.map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
          {!selectedCategory && (
            <span className="text-xs text-muted">เลือกชั้นเรียนก่อนเพื่อกรองตามวิชา</span>
          )}
        </label>
      </div>

      <WorksheetGrid worksheets={worksheets} emptyMessage={emptyMessage} />
    </>
  );
}
