import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import MarkdownEditor from "@/app/_components/markdown-editor";
import CoverImagePreview from "@/app/_components/cover-image-preview";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

async function createPost(formData: FormData) {
  "use server";

  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim() || null;
  const status = normalizePostStatus(formData.get("status"));

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
    },
  });

  redirect(status === "published" ? `/blog/${post.slug}` : "/admin/dashboard");
}

export default async function NewPostPage() {
  await requireAdmin();

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
            className="rounded-lg border border-black/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/40 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-white/20 dark:bg-white/5 dark:placeholder:text-white/40"
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
            className="rounded-lg border border-black/15 bg-white px-4 py-3 font-mono text-sm outline-none transition placeholder:text-black/40 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-white/20 dark:bg-white/5 dark:placeholder:text-white/40"
          />
          <span className="text-xs text-black/60 dark:text-white/60">
            Use lowercase letters, numbers, and hyphens. This becomes the public URL.
          </span>
        </label>

        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Cover Image URL (optional)</span>
            <input
              name="coverImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="rounded-lg border border-black/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/40 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-white/20 dark:bg-white/5 dark:placeholder:text-white/40"
            />
            <span className="text-xs text-black/60 dark:text-white/60">
              Optional cover image that will appear at the top of the blog post.
            </span>
          </label>
          <div className="rounded-xl border border-dashed border-black/15 p-4 dark:border-white/20">
            <CoverImagePreview imageUrl="" />
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <span className="font-medium">Content</span>
          <MarkdownEditor name="content" required />
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue="draft"
            className="rounded-lg border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-white/20 dark:bg-white/5"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="text-xs text-black/60 dark:text-white/60">
            Draft posts are saved in admin only and hidden from public blog pages.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-5 dark:border-white/15">
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
          >
            Save post
          </button>
          <p className="text-xs text-black/60 dark:text-white/60">
            Published posts will appear on the public blog. Drafts stay hidden.
          </p>
        </div>
      </form>
    </CmsShell>
  );
}