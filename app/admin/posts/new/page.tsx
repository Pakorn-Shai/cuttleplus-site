import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import CategorySelect from "@/app/_components/category-select";
import CoverImagePreview from "@/app/_components/cover-image-preview";
import MarkdownEditorClient from "@/components/MarkdownEditorClient";
import PostEditorSeoPanel from "@/components/PostEditorSeoPanel";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSEO } from "@/lib/seoChecker";

const POST_STATUSES = ["draft", "published"] as const;

function normalizePostStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "draft").trim();

  if (!POST_STATUSES.includes(status as (typeof POST_STATUSES)[number])) {
    throw new Error("Post status must be draft or published.");
  }

  return status;
}

export const metadata: Metadata = {
  title: "New Post | Admin",
};

async function checkPostSEO(input: {
  title: string;
  content: string;
  category: string;
  coverImageUrl?: string | null;
}) {
  "use server";

  await requireAdmin();

  return checkSEO({
    title: input.title,
    content: input.content,
    category: input.category,
    coverImageUrl: input.coverImageUrl,
  });
}

async function createPost(formData: FormData) {
  "use server";

  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim() || null;
  const status = normalizePostStatus(formData.get("status"));
  const categoryId = formData.get("categoryId")
    ? Number(formData.get("categoryId"))
    : null;
  const subcategoryId = formData.get("subcategoryId")
    ? Number(formData.get("subcategoryId"))
    : null;
  const meta_title = formData.get("meta_title")
    ? String(formData.get("meta_title")).trim() || null
    : null;
  const meta_description = formData.get("meta_description")
    ? String(formData.get("meta_description")).trim() || null
    : null;

  if (!title || !slug || !content) {
    throw new Error("Title, slug, and content are required.");
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      coverImage,
      status,
      categoryId,
      subcategoryId,
      meta_title,
      meta_description,
    },
  });

  redirect(status === "published" ? `/blog/${post.slug}` : "/admin/dashboard");
}

export default async function NewPostPage() {
  await requireAdmin();
  const content = "";

  return (
    <CmsShell
      eyebrow="Admin"
      title="Create a new post"
      description="Write a blog post and choose whether it should be public."
      links={[
        { href: "/admin/dashboard", label: "Back to dashboard" },
        { href: "/blog", label: "Preview public blog" },
      ]}
    >
      <form action={createPost} className="grid gap-5">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            name="title"
            type="text"
            required
            placeholder="Introducing CuttlePlus"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Slug</span>
          <input
            name="slug"
            type="text"
            required
            placeholder="introducing-cuttleplus"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Use lowercase letters, numbers, and hyphens only."
            className="rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-muted">
            Use lowercase letters, numbers, and hyphens. This becomes the public URL.
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Meta Title (optional)</span>
          <input
            name="meta_title"
            type="text"
            placeholder="SEO title for search engines"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-muted">
            Optional. If left empty, the post title will be used for SEO.
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Meta Description (optional)</span>
          <textarea
            name="meta_description"
            placeholder="Brief description for search engine results"
            rows={3}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
          />
          <span className="text-xs text-muted">
            Optional. Keep under 160 characters for optimal SEO.
          </span>
        </label>

        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Cover Image URL (optional)</span>
            <input
              name="coverImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-muted">
              Optional cover image that will appear at the top of the blog post.
            </span>
          </label>
          <div className="rounded-xl border border-dashed border-border p-4">
            <CoverImagePreview imageUrl="" />
          </div>
        </div>

        <CategorySelect />

        <div className="grid gap-2 text-sm">
          <span className="font-medium">Content</span>
          <MarkdownEditorClient name="content" defaultValue={content} />
          <PostEditorSeoPanel checkSeoAction={checkPostSEO} />
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue="draft"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="text-xs text-muted">
            Draft posts are saved in admin only and hidden from public blog pages.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Save post
          </button>
          <p className="text-xs text-muted">
            Published posts will appear on the public blog. Drafts stay hidden.
          </p>
        </div>
      </form>
    </CmsShell>
  );
}