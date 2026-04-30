import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { logoutAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadgeClassName(status: string) {
  if (status === "published") {
    return "bg-primary/10 text-primary ring-primary/20";
  }

  return "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300";
}

async function deletePost(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    throw new Error("A valid post id is required.");
  }

  const deletedPost = await prisma.post.delete({
    where: {
      id,
    },
    select: {
      slug: true,
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/blog");
  revalidatePath(`/blog/${deletedPost.slug}`);
}

async function logout() {
  "use server";

  await logoutAdmin();
  redirect("/admin/login");
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CmsShell
      eyebrow="Admin"
      title="Post management"
      description="Review, create, edit, and delete blog posts."
      links={[
        { href: "/blog", label: "Preview public blog" },
      ]}
    >
      <section className="space-y-5">
        <form action={logout} className="flex justify-end">
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-surface-muted"
          >
            Logout
          </button>
        </form>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">All posts</h2>
            <p className="mt-1 text-sm text-muted">
              {posts.length} {posts.length === 1 ? "post" : "posts"} in your blog.
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            New Post
          </Link>
        </div>

        {posts.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface/80 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4">
                      Title
                    </th>
                    <th scope="col" className="px-5 py-4">
                      Slug
                    </th>
                    <th scope="col" className="px-5 py-4">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-4">
                      Created
                    </th>
                    <th scope="col" className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => (
                    <tr key={post.id} className="transition hover:bg-primary/[0.06]">
                      <td className="px-5 py-4 align-middle">
                        <div className="font-semibold text-foreground">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <code className="rounded-md bg-surface-muted px-2 py-1 text-xs text-muted">
                          {post.slug}
                        </code>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusBadgeClassName(post.status)}`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 align-middle text-muted">
                        {formatPostDate(post.createdAt)}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="rounded-md border border-border px-3 py-2 text-xs font-semibold transition hover:bg-surface-muted"
                          >
                            Edit
                          </Link>
                          <form action={deletePost}>
                            <input type="hidden" name="id" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-500/10 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
            <h2 className="text-lg font-semibold">No posts yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Create your first blog post to populate the public blog and start managing content here.
            </p>
            <Link
              href="/admin/posts/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
            >
              New Post
            </Link>
          </div>
        )}
      </section>
    </CmsShell>
  );
}