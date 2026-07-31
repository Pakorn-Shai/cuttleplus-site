"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

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

type WorksheetCategorySelectProps = {
  initialCategoryId?: number | null;
  initialSubcategoryId?: number | null;
};

export default function WorksheetCategorySelect({
  initialCategoryId,
  initialSubcategoryId,
}: WorksheetCategorySelectProps) {
  const [categories, setCategories] = useState<WorksheetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    initialCategoryId ?? undefined
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>(
    initialSubcategoryId ?? undefined
  );
  const [invalidInitialSubcategory, setInvalidInitialSubcategory] = useState(false);

  useEffect(() => {
    fetch("/api/worksheet-categories")
      .then((res) => res.json())
      .then((data: WorksheetCategory[]) => {
        const initialCategory = data.find((category) => category.id === initialCategoryId);
        const initialSubcategoryIsValid = initialCategory?.subcategories.some(
          (subcategory) => subcategory.id === initialSubcategoryId
        );

        setCategories(data);
        if (initialSubcategoryId && !initialSubcategoryIsValid) {
          setSelectedSubcategoryId(undefined);
          setInvalidInitialSubcategory(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialCategoryId, initialSubcategoryId]);

  const handleCategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value ? Number(event.target.value) : undefined;
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(undefined);
    setInvalidInitialSubcategory(false);
  }, []);

  const handleSubcategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = event.target.value ? Number(event.target.value) : undefined;
    setSelectedSubcategoryId(subcategoryId);
  }, []);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const subcategoryDisabled = !selectedCategoryId || subcategories.length === 0;

  if (loading) {
    return <div className="text-sm text-muted">Loading worksheet categories...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/admin/worksheet-categories" className="font-medium text-primary underline-offset-4 hover:underline">
          Manage worksheet categories
        </Link>
        <Link href="/admin/worksheet-subcategories" className="font-medium text-primary underline-offset-4 hover:underline">
          Manage worksheet subcategories
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Worksheet Category</span>
          <select
            name="categoryId"
            value={selectedCategoryId ?? ""}
            onChange={handleCategoryChange}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">
            Choose the main group for this worksheet, such as Kindergarten 1 or Coloring Pages.
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Worksheet Subcategory</span>
          <select
            name="subcategoryId"
            value={selectedSubcategoryId ?? ""}
            onChange={handleSubcategoryChange}
            disabled={subcategoryDisabled}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!selectedCategoryId ? (
              <option value="">Select a category first</option>
            ) : subcategories.length === 0 ? (
              <option value="">No subcategories in this category</option>
            ) : (
              <>
                <option value="">No subcategory</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <span className="text-xs text-muted">
            Choose a subject or smaller group, such as Math, English, Animals, or Numbers.
          </span>
          {invalidInitialSubcategory && (
            <span className="text-xs text-amber-700">
              The previous subcategory did not belong to the selected category, so it was cleared.
            </span>
          )}
        </label>
      </div>
    </div>
  );
}
