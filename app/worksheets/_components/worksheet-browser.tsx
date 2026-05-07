"use client";

import { useMemo, useState } from "react";
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
};

export function WorksheetBrowser({
  categories,
  worksheets,
  selectedCategorySlug,
  selectedSubcategorySlug,
}: WorksheetBrowserProps) {
  const router = useRouter();
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);
  const [subjectOnlySlug, setSubjectOnlySlug] = useState(
    selectedCategory ? "" : selectedSubcategorySlug ?? ""
  );

  const subjectOptions = useMemo(() => {
    const sourceSubcategories = selectedCategory
      ? selectedCategory.subcategories
      : categories.flatMap((category) => category.subcategories);
    const subjectsBySlug = new Map<string, WorksheetSubcategory>();

    for (const subcategory of sourceSubcategories) {
      if (!subjectsBySlug.has(subcategory.slug)) {
        subjectsBySlug.set(subcategory.slug, subcategory);
      }
    }

    return Array.from(subjectsBySlug.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [categories, selectedCategory]);

  const currentSubjectSlug = selectedCategory
    ? selectedSubcategorySlug ?? ""
    : subjectOnlySlug;
  const visibleWorksheets = selectedCategory || !subjectOnlySlug
    ? worksheets
    : worksheets.filter((worksheet) => worksheet.subcategory?.slug === subjectOnlySlug);

  return (
    <>
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-surface/60 p-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">ชั้นเรียน</span>
          <select
            value={selectedCategorySlug ?? ""}
            onChange={(event) => {
              const categorySlug = event.target.value;
              setSubjectOnlySlug("");
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
            value={currentSubjectSlug}
            onChange={(event) => {
              const subcategorySlug = event.target.value;

              if (!selectedCategory) {
                setSubjectOnlySlug(subcategorySlug);
                return;
              }

              router.push(
                subcategorySlug
                  ? `/worksheets/${selectedCategory.slug}/${subcategorySlug}`
                  : `/worksheets/${selectedCategory.slug}`
              );
            }}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">ทุกวิชา</option>
            {subjectOptions.map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <WorksheetGrid worksheets={visibleWorksheets} />
    </>
  );
}
