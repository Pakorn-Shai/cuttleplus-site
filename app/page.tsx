export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hero-from via-hero-via to-hero-to">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <div className="relative z-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              CuttlePlus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
              Read about technology, tools, and tutorials made simple.
            </p>
            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-lg bg-surface px-6 py-3 font-semibold text-primary shadow-lg shadow-black/10 transition hover:bg-surface-muted hover:shadow-xl"
              >
                Start Reading
              </Link>
            </div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Recent Posts Section */}
      <section className="bg-background pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
              <p className="mt-1 text-sm text-muted">
                The latest published articles from CuttlePlus.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center text-sm font-medium text-primary transition hover:text-primary-hover"
            >
              View all
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {posts.length ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group rounded-xl border border-border bg-surface/70 p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                    {post.coverImage && (
                      <div className="mb-4 flex-shrink-0 overflow-hidden rounded-lg border border-border sm:mb-0 sm:w-32">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-24 w-full object-cover transition-transform group-hover:scale-105 sm:h-24"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                        {formatPostDate(post.createdAt)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">
                        <Link href={`/blog/${post.slug}`} className="underline-offset-4 hover:underline group-hover:text-primary">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {getExcerpt(post.content)}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
              <svg className="mx-auto mb-4 h-10 w-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm text-muted">
                No posts have been published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} CuttlePlus. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}