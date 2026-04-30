import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
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
  title: "Edit Post | Admin",
};

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updatePost(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));
  const previousSlug = String(formData.get("previousSlug") ?? "").trim();
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

  if (!Number.isInteger(id)) {
    throw new Error("A valid post id is required.");
  }

  if (!title || !slug || !content) {
    throw new Error("Title, slug, and content are required.");
  }

  await prisma.post.update({
    where: {
      id,
    },
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

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }

  redirect("/admin/dashboard");
}

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

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin();

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    notFound();
  }

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: {
      category: true,
      subcategory: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Edit post"
      description="Update an existing blog post."
      links={[
        { href: "/admin/dashboard", label: "Back to dashboard" },
        { href: `/blog/${post.slug}`, label: "View public post" },
      ]}
    >
      <form action={updatePost} className="grid gap-5">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="previousSlug" value={post.slug} />

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Slug</span>
          <input
            name="slug"
            type="text"
            required
            defaultValue={post.slug}
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
            defaultValue={post.meta_title || ""}
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
            defaultValue={post.meta_description || ""}
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
              defaultValue={post.coverImage || ""}
              placeholder="https://example.com/image.jpg"
              className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-muted">
              Optional cover image that will appear at the top of the blog post.
            </span>
          </label>
          <div className="rounded-xl border border-dashed border-border p-4">
            <CoverImagePreview imageUrl={post.coverImage} />
          </div>
        </div>

        <CategorySelect
          initialCategoryId={post.categoryId}
          initialSubcategoryId={post.subcategoryId}
        />

        <div className="grid gap-2 text-sm">
          <span className="font-medium">Content</span>
          <MarkdownEditorClient name="content" defaultValue={post.content} required />
          <PostEditorSeoPanel checkSeoAction={checkPostSEO} coverImageUrl={post.coverImage} />
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue={post.status}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="text-xs text-muted">
            Draft posts remain editable here but are hidden from public blog pages.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Save changes
          </button>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-border px-5 py-3 text-sm font-semibold transition hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </CmsShell>
  );
}