"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CmsShell } from "@/app/_components/cms-shell";

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
  _count: {
    posts: number;
  };
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [newForm, setNewForm] = useState({ name: "", slug: "" });
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });

      if (res.ok) {
        setNewForm({ name: "", slug: "" });
        setShowNewForm(false);
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create category");
      }
    } catch {
      setError("Failed to create category");
    }
  };

  const handleUpdate = async (id: number) => {
    setError("");

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditingId(null);
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update category");
      }
    } catch {
      setError("Failed to update category");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? This will also delete all its subcategories.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
      }
    } catch {
      alert("Failed to delete category");
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ name: category.name, slug: category.slug });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (loading) {
    return (
      <CmsShell
        eyebrow="Admin"
        title="Categories"
        description="Loading..."
        links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
      >
        <p className="text-sm text-muted">Loading categories...</p>
      </CmsShell>
    );
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Categories"
      description="Manage blog categories and subcategories."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          {showNewForm ? "Cancel" : "Add Category"}
        </button>
        <Link
          href="/admin/subcategories"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
        >
          Manage Subcategories
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showNewForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-sm font-semibold">New Category</h3>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Name</span>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewForm({ name, slug: generateSlug(name) });
                }}
                required
                placeholder="Technology"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Slug</span>
              <input
                type="text"
                value={newForm.slug}
                onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                required
                placeholder="technology"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
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
            <div
              key={category.id}
              className="rounded-xl border border-border bg-surface/60 p-5"
            >
              {editingId === category.id ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditForm({ name, slug: generateSlug(name) });
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
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      required
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(category.id)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <p className="mt-1 text-sm text-muted">
                        Slug: <span className="font-mono">{category.slug}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {category._count.posts} post{category._count.posts !== 1 ? "s" : ""} •{" "}
                        {category.subcategories.length} subcategor{category.subcategories.length !== 1 ? "ies" : "y"}
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
                          <span
                            key={sub.id}
                            className="rounded-md bg-surface-muted px-2 py-1 text-xs"
                          >
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
          No categories have been added yet.
        </p>
      )}
    </CmsShell>
  );
}
