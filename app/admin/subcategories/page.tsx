"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CmsShell } from "@/app/_components/cms-shell";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: Category;
  _count: {
    posts: number;
  };
}

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", categoryId: "" });
  const [newForm, setNewForm] = useState({ name: "", slug: "", categoryId: "" });
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchData = async () => {
    try {
      const [subcatsRes, catsRes] = await Promise.all([
        fetch("/api/subcategories"),
        fetch("/api/categories"),
      ]);

      if (subcatsRes.ok) {
        const data = await subcatsRes.json();
        setSubcategories(data);
      }

      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });

      if (res.ok) {
        setNewForm({ name: "", slug: "", categoryId: "" });
        setShowNewForm(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create subcategory");
      }
    } catch (err) {
      setError("Failed to create subcategory");
    }
  };

  const handleUpdate = async (id: number) => {
    setError("");

    try {
      const res = await fetch(`/api/subcategories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update subcategory");
      }
    } catch (err) {
      setError("Failed to update subcategory");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete subcategory "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subcategories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete subcategory");
      }
    } catch (err) {
      alert("Failed to delete subcategory");
    }
  };

  const startEdit = (subcategory: Subcategory) => {
    setEditingId(subcategory.id);
    setEditForm({
      name: subcategory.name,
      slug: subcategory.slug,
      categoryId: subcategory.categoryId.toString(),
    });
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
        title="Subcategories"
        description="Loading..."
        links={[
          { href: "/admin/dashboard", label: "Back to dashboard" },
          { href: "/admin/categories", label: "Manage categories" },
        ]}
      >
        <p className="text-sm text-muted">Loading subcategories...</p>
      </CmsShell>
    );
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Subcategories"
      description="Manage blog subcategories."
      links={[
        { href: "/admin/dashboard", label: "Back to dashboard" },
        { href: "/admin/categories", label: "Manage categories" },
      ]}
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          {showNewForm ? "Cancel" : "Add Subcategory"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {categories.length === 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          No categories available. Please{" "}
          <Link href="/admin/categories" className="font-medium underline">
            create a category
          </Link>{" "}
          first.
        </div>
      )}

      {showNewForm && categories.length > 0 && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-sm font-semibold">New Subcategory</h3>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Category *</span>
              <select
                value={newForm.categoryId}
                onChange={(e) => setNewForm({ ...newForm, categoryId: e.target.value })}
                required
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Name</span>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewForm({ ...newForm, name, slug: generateSlug(name) });
                }}
                required
                placeholder="Programming"
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
                placeholder="programming"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
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
            <div
              key={subcategory.id}
              className="rounded-xl border border-border bg-surface/60 p-5"
            >
              {editingId === subcategory.id ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Category *</span>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                      required
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditForm({ ...editForm, name, slug: generateSlug(name) });
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
                      onClick={() => handleUpdate(subcategory.id)}
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
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{subcategory.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      Category: <span className="font-medium">{subcategory.category.name}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Slug: <span className="font-mono">{subcategory.slug}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {subcategory._count.posts} post{subcategory._count.posts !== 1 ? "s" : ""}
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
          No subcategories have been added yet.
        </p>
      )}
    </CmsShell>
  );
}