"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CmsShell } from "@/app/_components/cms-shell";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

type WorksheetCategory = {
  id: number;
  name: string;
  slug: string;
};

type WorksheetSubcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: WorksheetCategory;
  _count: {
    worksheets: number;
  };
};

export default function WorksheetSubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<WorksheetSubcategory[]>([]);
  const [categories, setCategories] = useState<WorksheetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", categoryId: "" });
  const [newForm, setNewForm] = useState({ name: "", slug: "", categoryId: "" });
  const [newSlugEdited, setNewSlugEdited] = useState(false);
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchData = async () => {
    try {
      const [subcategoriesRes, categoriesRes] = await Promise.all([
        fetch("/api/worksheet-subcategories"),
        fetch("/api/worksheet-categories"),
      ]);

      if (subcategoriesRes.ok) {
        setSubcategories(await subcategoriesRes.json());
      }

      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const name = newForm.name.trim();
    const slug = normalizeSlug(newForm.slug || name, "worksheet-subcategory");

    if (!name || !newForm.categoryId) {
      setError("Worksheet subcategory name and category are required.");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Slug must use lowercase letters, numbers, and hyphens only.");
      return;
    }

    try {
      const res = await fetch("/api/worksheet-subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, name, slug }),
      });

      if (res.ok) {
        setNewForm({ name: "", slug: "", categoryId: "" });
        setNewSlugEdited(false);
        setShowNewForm(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create worksheet subcategory");
      }
    } catch {
      setError("Failed to create worksheet subcategory");
    }
  };

  const handleUpdate = async (id: number) => {
    setError("");

    const name = editForm.name.trim();
    const slug = normalizeSlug(editForm.slug || name, "worksheet-subcategory");

    if (!name || !editForm.categoryId) {
      setError("Worksheet subcategory name and category are required.");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Slug must use lowercase letters, numbers, and hyphens only.");
      return;
    }

    try {
      const res = await fetch(`/api/worksheet-subcategories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, name, slug }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditSlugEdited(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update worksheet subcategory");
      }
    } catch {
      setError("Failed to update worksheet subcategory");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete worksheet subcategory "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/worksheet-subcategories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete worksheet subcategory");
      }
    } catch {
      alert("Failed to delete worksheet subcategory");
    }
  };

  const startEdit = (subcategory: WorksheetSubcategory) => {
    setEditingId(subcategory.id);
    setEditForm({
      name: subcategory.name,
      slug: subcategory.slug,
      categoryId: subcategory.categoryId.toString(),
    });
    setEditSlugEdited(false);
    setError("");
  };

  if (loading) {
    return (
      <CmsShell
        eyebrow="Admin"
        title="Worksheet Subcategories"
        description="Loading..."
        links={[
          { href: "/admin/dashboard", label: "Back to dashboard" },
          { href: "/admin/worksheet-categories", label: "Manage categories" },
        ]}
      >
        <p className="text-sm text-muted">Loading worksheet subcategories...</p>
      </CmsShell>
    );
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Worksheet Subcategories"
      description="Manage worksheet subjects inside each grade or audience group."
      links={[
        { href: "/admin/dashboard", label: "Back to dashboard" },
        { href: "/admin/worksheet-categories", label: "Manage categories" },
      ]}
    >
      <p className="mb-4 rounded-lg border border-border bg-surface/60 p-3 text-sm text-muted">
        Worksheet subcategories should belong to one worksheet category.
      </p>

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          {showNewForm ? "Cancel" : "Add Worksheet Subcategory"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {categories.length === 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          No worksheet categories available. Please{" "}
          <Link href="/admin/worksheet-categories" className="font-medium underline">
            create a worksheet category
          </Link>{" "}
          first.
        </div>
      )}

      {showNewForm && categories.length > 0 && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-sm font-semibold">New Worksheet Subcategory</h3>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Category *</span>
              <select
                value={newForm.categoryId}
                onChange={(event) => setNewForm({ ...newForm, categoryId: event.target.value })}
                required
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Name</span>
              <input
                type="text"
                value={newForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setNewForm({
                    ...newForm,
                    name,
                    slug: newSlugEdited ? newForm.slug : normalizeSlug(name, "worksheet-subcategory"),
                  });
                }}
                required
                placeholder="Mathematics"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Slug</span>
              <input
                type="text"
                value={newForm.slug}
                onChange={(event) => {
                  setNewSlugEdited(true);
                  const rawSlug = event.target.value;
                  setNewForm({
                    ...newForm,
                    slug: rawSlug.trim() ? normalizeSlug(rawSlug, "worksheet-subcategory") : "",
                  });
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="math"
                className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-xs text-muted">Leave blank to auto-generate from the name.</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
              >
                Create Subcategory
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNewForm({ name: "", slug: "", categoryId: "" });
                  setNewSlugEdited(false);
                  setError("");
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {subcategories.length ? (
        <div className="grid gap-4">
          {subcategories.map((subcategory) => (
            <div key={subcategory.id} className="rounded-xl border border-border bg-surface/60 p-5">
              {editingId === subcategory.id ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Category *</span>
                    <select
                      value={editForm.categoryId}
                      onChange={(event) => setEditForm({ ...editForm, categoryId: event.target.value })}
                      required
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      type="text"
                      value={editForm.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          setEditForm({
                            ...editForm,
                            name,
                            slug: editSlugEdited ? editForm.slug : normalizeSlug(name, "worksheet-subcategory"),
                          });
                        }}
                      required
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Slug</span>
                    <input
                      type="text"
                      value={editForm.slug}
                        onChange={(event) => {
                          setEditSlugEdited(true);
                          const rawSlug = event.target.value;
                          setEditForm({
                            ...editForm,
                            slug: rawSlug.trim() ? normalizeSlug(rawSlug, "worksheet-subcategory") : "",
                          });
                        }}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                      <span className="text-xs text-muted">Leave blank to auto-generate from the name.</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(subcategory.id)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditSlugEdited(false);
                        setError("");
                      }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{subcategory.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      Category: <span className="font-medium">{subcategory.category.name}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Slug: <span className="font-mono">{subcategory.slug}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {subcategory._count.worksheets} worksheet{subcategory._count.worksheets !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(subcategory)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-muted"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subcategory.id, subcategory.name)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No worksheet subcategories have been added yet.
        </p>
      )}
    </CmsShell>
  );
}
