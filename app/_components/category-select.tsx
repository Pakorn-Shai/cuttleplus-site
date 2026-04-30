"use client";

import { useEffect, useState, useCallback } from "react";

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

type CategorySelectProps = {
  initialCategoryId?: number | null;
  initialSubcategoryId?: number | null;
  onCategoryChange?: (categoryId: number | null, subcategoryId: number | null) => void;
};

export default function CategorySelect({
  initialCategoryId,
  initialSubcategoryId,
  onCategoryChange,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    initialCategoryId ?? undefined
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>(
    initialSubcategoryId ?? undefined
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const categoryId = e.target.value ? Number(e.target.value) : null;
      setSelectedCategoryId(categoryId ?? undefined);
      setSelectedSubcategoryId(undefined);
      onCategoryChange?.(categoryId, null);
    },
    [onCategoryChange]
  );

  const handleSubcategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const subcategoryId = e.target.value ? Number(e.target.value) : null;
      setSelectedSubcategoryId(subcategoryId ?? undefined);
      onCategoryChange?.(selectedCategoryId ?? null, subcategoryId);
    },
    [onCategoryChange, selectedCategoryId]
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  if (loading) {
    return <div className="text-sm text-muted">Loading categories...</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Category</span>
        <select
          name="categoryId"
          value={selectedCategoryId ?? ""}
          onChange={handleCategoryChange}
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select category...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Subcategory</span>
        <select
          name="subcategoryId"
          value={selectedSubcategoryId ?? ""}
          onChange={handleSubcategoryChange}
          disabled={!selectedCategoryId}
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select subcategory...</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
        {!selectedCategoryId && (
          <span className="text-xs text-muted">Select a category first.</span>
        )}
      </label>
    </div>
  );
}