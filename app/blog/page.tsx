import Link from "next/link";
import type { Metadata } from "next";
import { CmsShell } from "@/app/_components/cms-shell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest posts from CuttlePlus.",
};

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getExcerpt(content: string) {
  const normalizedContent = content.replace(/\s+/g, " ").trim();

  if (normalizedContent.length <= 160) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 157)}...`;
}

export default async function BlogIndexPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CmsShell
      eyebrow="Public blog"
      title="Blog"
      description="Read the latest posts from CuttlePlus."
      links={[{ href: "/", label: "Back to home" }]}
    >
      {posts.length ? (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-black/10 bg-white/60 p-5 transition hover:border-emerald-500/50 hover:shadow-sm dark:border-white/15 dark:bg-white/5"
            >
              <article>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  {formatPostDate(post.createdAt)}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.coverImage && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-black/10 bg-white/60 dark:border-white/15 dark:bg-white/5">
                    <img
                      src={post.coverImage}
                      alt={`Cover image for ${post.title}`}
                      className="h-auto w-full object-cover"
                      style={{ maxHeight: "200px" }}
                    />
                  </div>
                )}
                <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white/70">
                  {getExcerpt(post.content)}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                >
                  Read post →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-black/10 bg-white/60 p-5 text-sm text-black/70 dark:border-white/15 dark:bg-white/5 dark:text-white/70">
          No posts have been published yet. Check back soon.
        </p>
      )}
    </CmsShell>
  );
}
