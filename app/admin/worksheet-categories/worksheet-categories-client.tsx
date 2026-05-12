"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CmsShell } from "@/app/_components/cms-shell";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

type WorksheetSubcategory = {
  id: number;
  name: string;
  slug: string;
};

type WorksheetCategory = {
  id: number;
  name: string;
  slug: string;
  subcategories: WorksheetSubcategory[];
  _count: {
    worksheets: number;
    subcategories: number;
  };
};

export default function WorksheetCategoriesPage() {
  const [categories, setCategories] = useState<WorksheetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [newForm, setNewForm] = useState({ name: "", slug: "" });
  const [newSlugEdited, setNewSlugEdited] = useState(false);
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/worksheet-categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const name = newForm.name.trim();
    const slug = normalizeSlug(newForm.slug || name, "worksheet-category");

    if (!name) {
      setError("Worksheet category name is required.");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Slug must use lowercase letters, numbers, and hyphens only.");
      return;
    }

    try {
      const res = await fetch("/api/worksheet-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      if (res.ok) {
        setNewForm({ name: "", slug: "" });
        setNewSlugEdited(false);
        setShowNewForm(false);
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create worksheet category");
      }
    } catch {
      setError("Failed to create worksheet category");
    }
  };

  const handleUpdate = async (id: number) => {
    setError("");

    const name = editForm.name.trim();
    const slug = normalizeSlug(editForm.slug || name, "worksheet-category");

    if (!name) {
      setError("Worksheet category name is required.");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Slug must use lowercase letters, numbers, and hyphens only.");
      return;
    }

    try {
      const res = await fetch(`/api/worksheet-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditSlugEdited(false);
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update worksheet category");
      }
    } catch {
      setError("Failed to update worksheet category");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete worksheet category "${name}"? Its subcategories will also be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/worksheet-categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete worksheet category");
      }
    } catch {
      alert("Failed to delete worksheet category");
    }
  };

  const startEdit = (category: WorksheetCategory) => {
    setEditingId(category.id);
    setEditForm({ name: category.name, slug: category.slug });
    setEditSlugEdited(false);
    setError("");
  };

  if (loading) {
    return (
      <CmsShell
        eyebrow="Admin"
        title="Worksheet Categories"
        description="Loading..."
        links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
      >
        <p className="text-sm text-muted">Loading worksheet categories...</p>
      </CmsShell>
    );
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Worksheet Categories"
      description="Manage grade levels and audience groups for worksheets."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <p className="mb-4 rounded-lg border border-border bg-surface/60 p-3 text-sm text-muted">
        Worksheet categories are used to group worksheets on the public Worksheets page.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          {showNewForm ? "Cancel" : "Add Worksheet Category"}
        </button>
        <Link
          href="/admin/worksheet-subcategories"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
        >
          Manage Worksheet Subcategories
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showNewForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-sm font-semibold">New Worksheet Category</h3>
          <div className="grid gap-4">
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
                    slug: newSlugEdited ? newForm.slug : normalizeSlug(name, "worksheet-category"),
                  });
                }}
                required
                placeholder="Prathom 2"
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
                    slug: rawSlug.trim() ? normalizeSlug(rawSlug, "worksheet-category") : "",
                  });
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="prathom-2"
                className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-xs text-muted">Leave blank to auto-generate from the name.</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNewForm({ name: "", slug: "" });
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

      {categories.length ? (
        <div className="grid gap-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded-xl border border-border bg-surface/60 p-5">
              {editingId === category.id ? (
                <div className="grid gap-4">
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
                            slug: editSlugEdited ? editForm.slug : normalizeSlug(name, "worksheet-category"),
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
                            slug: rawSlug.trim() ? normalizeSlug(rawSlug, "worksheet-category") : "",
                          });
                        }}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                      <span className="text-xs text-muted">Leave blank to auto-generate from the name.</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(category.id)}
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
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <p className="mt-1 text-sm text-muted">
                        Slug: <span className="font-mono">{category.slug}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {category._count.worksheets} worksheet{category._count.worksheets !== 1 ? "s" : ""} /{" "}
                        {category._count.subcategories} subcategor{category._count.subcategories !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(category)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {category.subcategories.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-2 text-xs font-medium text-muted">Subcategories:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((sub) => (
                          <span key={sub.id} className="rounded-md bg-surface-muted px-2 py-1 text-xs">
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No worksheet categories have been added yet.
        </p>
      )}
    </CmsShell>
  );
}
