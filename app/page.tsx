export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isHttpUrl } from "@/lib/urls";

const POSTS_PER_CATEGORY = 6;
const WORKSHEETS_LIMIT = 6;

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
  const [categories, worksheets] = await Promise.all([
    prisma.category.findMany({
      include: {
        subcategories: true,
        posts: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: POSTS_PER_CATEGORY,
          include: {
            subcategory: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.worksheet.findMany({
      orderBy: { createdAt: "desc" },
      take: WORKSHEETS_LIMIT,
    }),
  ]);

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

      {/* Categories Section */}
      <section className="bg-background pb-16">
        <div className="mx-auto max-w-5xl px-6">
          {categories.map((category) => (
            <section key={category.id} className="mb-16">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    Latest articles in {category.name.toLowerCase()}.
                  </p>
                </div>
                <Link
                  href={`/blog/${category.slug}`}
                  className="inline-flex items-center text-sm font-medium text-primary transition hover:text-primary-hover"
                >
                  View all
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {category.posts.length ? (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {category.posts.map((post) => (
                    <li key={post.id}>
                      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/70 shadow-sm transition hover:border-primary/50 hover:shadow-md">
                        {post.coverImage ? (
                          <Link href={`/blog/${post.slug}`} className="block">
                            <div className="overflow-hidden">
                              <img
                                src={post.coverImage}
                                alt={`Cover image for ${post.title}`}
                                className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="h-40 bg-surface-muted/50" />
                        )}
                        <div className="flex flex-1 flex-col p-4">
                          {post.subcategory && (
                            <Link
                              href={`/blog/${category.slug}/${post.subcategory.slug}`}
                              className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                            >
                              {post.subcategory.name}
                            </Link>
                          )}
                          <h3 className="text-base font-semibold tracking-tight">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="underline-offset-4 hover:underline"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="mt-2 flex-1 text-sm leading-6 text-muted line-clamp-2">
                            {getExcerpt(post.content)}
                          </p>
                          <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                            {formatPostDate(post.createdAt)}
                          </p>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
                  <p className="text-sm text-muted">
                    No posts yet in this category. Check back soon!
                  </p>
                </div>
              )}
            </section>
          ))}

          {categories.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
              <svg className="mx-auto mb-4 h-10 w-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm text-muted">
                No categories have been created yet. Check back soon!
              </p>
            </div>
          )}

          <section className="mt-16">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Worksheets</h2>
                <p className="mt-1 text-sm text-muted">
                  Latest worksheets and learning resources.
                </p>
              </div>
              <Link
                href="/worksheets"
                className="inline-flex items-center whitespace-nowrap text-sm font-medium text-primary transition hover:text-primary-hover"
              >
                View all
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {worksheets.length ? (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {worksheets.map((worksheet) => {
                  const hasValidLink = isHttpUrl(worksheet.link);
                  const hasValidImageUrl = isHttpUrl(worksheet.imageUrl);
                  const image = (
                    <div className="overflow-hidden">
                      {hasValidImageUrl ? (
                        <img
                          src={worksheet.imageUrl}
                          alt={worksheet.title}
                          className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center bg-surface-muted px-4 text-center text-sm text-muted">
                          Image URL is invalid.
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <li key={worksheet.id}>
                      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/70 shadow-sm transition hover:border-primary/50 hover:shadow-md">
                        {hasValidLink ? (
                          <a
                            href={worksheet.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {image}
                          </a>
                        ) : (
                          image
                        )}
                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="text-base font-semibold tracking-tight">
                            {hasValidLink ? (
                              <a
                                href={worksheet.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline-offset-4 hover:underline"
                              >
                                {worksheet.title}
                              </a>
                            ) : (
                              worksheet.title
                            )}
                          </h3>
                          <p className="mt-2 text-sm text-primary">
                            {hasValidLink ? (
                              <a
                                href={worksheet.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium hover:underline"
                              >
                                Open worksheet
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-8L10 10" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-muted">Worksheet link is invalid.</span>
                            )}
                          </p>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
                <p className="text-sm text-muted">
                  No worksheets have been added yet. Check back soon!
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} CuttlePlus. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
