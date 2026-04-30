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
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <div className="relative z-10 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              CuttlePlus CMS
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Welcome to CuttlePlus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
              A modern, lightweight Blog CMS built for speed and simplicity. 
              Create, manage, and publish content effortlessly with Next.js.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-emerald-700 shadow-lg shadow-black/10 transition hover:bg-emerald-50 hover:shadow-xl"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Blog
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center rounded-lg border-2 border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/20"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H4a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Admin Login
              </Link>
            </div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-950" />
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold tracking-tight">Fast & Lightweight</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                Built on Next.js for blazing-fast page loads.
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold tracking-tight">Easy Content Editing</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                Markdown support with live preview and cover images.
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold tracking-tight">Secure Admin</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                Protected dashboard with robust authentication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="bg-gray-50 pb-16 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                The latest published articles from CuttlePlus.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                  className="group rounded-xl border border-black/10 bg-white/70 p-5 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                    {post.coverImage && (
                      <div className="mb-4 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 sm:mb-0 sm:w-32">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-24 w-full object-cover transition-transform group-hover:scale-105 sm:h-24"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                        {formatPostDate(post.createdAt)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">
                        <Link href={`/blog/${post.slug}`} className="underline-offset-4 hover:underline group-hover:text-emerald-600 group-hover:dark:text-emerald-400">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">
                        {getExcerpt(post.content)}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-3 inline-flex text-sm font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/20 bg-white/50 p-8 text-center dark:border-white/20 dark:bg-white/5">
              <svg className="mx-auto mb-4 h-10 w-10 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm text-black/60 dark:text-white/60">
                No posts have been published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white py-8 dark:border-white/10 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-black/50 dark:text-white/50">
          <p>&copy; {new Date().getFullYear()} CuttlePlus. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}