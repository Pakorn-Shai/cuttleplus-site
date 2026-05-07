"use client";

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

  useEffect(() => {
    fetch("/api/worksheet-categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value ? Number(event.target.value) : undefined;
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(undefined);
  }, []);

  const handleSubcategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = event.target.value ? Number(event.target.value) : undefined;
    setSelectedSubcategoryId(subcategoryId);
  }, []);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  if (loading) {
    return <div className="text-sm text-muted">Loading worksheet categories...</div>;
  }

  return (
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
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Worksheet Subcategory</span>
        <select
          name="subcategoryId"
          value={selectedSubcategoryId ?? ""}
          onChange={handleSubcategoryChange}
          disabled={!selectedCategoryId}
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">No subcategory</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
        {!selectedCategoryId && (
          <span className="text-xs text-muted">Select a worksheet category first.</span>
        )}
      </label>
    </div>
  );
}
