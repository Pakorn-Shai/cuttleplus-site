export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArticleCard } from "@/app/_components/article-card";
import { prisma } from "@/lib/prisma";
import { isHttpUrl } from "@/lib/urls";

const POSTS_PER_CATEGORY = 6;
const WORKSHEETS_LIMIT = 6;
const SHELF_LIST_CLASS =
  "-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:thin] sm:gap-6";
const SHELF_ITEM_CLASS =
  "flex w-[84vw] flex-none snap-start sm:w-[42vw] lg:w-[320px]";

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
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: { createdAt: "desc" },
      take: WORKSHEETS_LIMIT,
    }),
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-hero-from via-hero-via to-hero-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.32),transparent_36%),radial-gradient(circle_at_18%_28%,rgba(20,184,166,0.38),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.2),transparent_26%)]" />
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -left-24 bottom-4 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,63,55,0.18),rgba(3,63,55,0.02)_45%,rgba(3,63,55,0.28))]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2288%22%20height%3D%2288%22%20viewBox%3D%220%200%2088%2088%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.12%22%3E%3Cpath%20d%3D%22M0%2044h88M44%200v88%22/%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2244%22%20r%3D%221.5%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.16%22%20stroke%3D%22none%22/%3E%3C/g%3E%3C/svg%3E')] opacity-25 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_72%,transparent)]" />
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20 md:py-24 lg:py-28">
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-6 h-px w-28 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
              CuttlePlus
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/90 drop-shadow-sm sm:mt-6">
              Read about technology, tools, and tutorials made simple.
            </p>
            <div className="mt-7 sm:mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full border border-white/40 bg-white px-6 py-3 font-semibold text-primary shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-surface-muted hover:shadow-2xl hover:shadow-emerald-950/25"
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
      <section className="bg-background pb-12 sm:pb-14">
        <div className="mx-auto max-w-5xl px-6">
          {categories.map((category) => (
            <section key={category.id} className="mb-12 sm:mb-14">
              <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
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
                <ul className={SHELF_LIST_CLASS}>
                  {category.posts.map((post) => (
                    <li key={post.id} className={SHELF_ITEM_CLASS}>
                      <ArticleCard post={post} category={category} />
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

          <section className="mt-12 sm:mt-14">
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
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
              <ul className={SHELF_LIST_CLASS}>
                {worksheets.map((worksheet) => {
                  const hasValidLink = isHttpUrl(worksheet.link);
                  const hasValidImageUrl = isHttpUrl(worksheet.imageUrl);
                  const image = (
                    <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
                      {hasValidImageUrl ? (
                        <img
                          src={worksheet.imageUrl}
                          alt={worksheet.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-muted px-4 text-center text-sm text-muted">
                          Image URL is invalid.
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <li key={worksheet.id} className={SHELF_ITEM_CLASS}>
                      <article className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 md:hover:-translate-y-1 md:hover:border-primary/40 md:hover:shadow-xl md:hover:shadow-primary/10">
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
                        <div className="flex flex-1 flex-col p-5">
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                            {worksheet.category ? worksheet.category.name : "Uncategorized"}
                            {worksheet.subcategory ? ` / ${worksheet.subcategory.name}` : ""}
                          </p>
                          <h3 className="min-h-[3rem] text-base font-semibold leading-6 tracking-tight sm:text-lg">
                            {hasValidLink ? (
                              <a
                                href={worksheet.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="line-clamp-2 underline-offset-4 hover:underline"
                              >
                                {worksheet.title}
                              </a>
                            ) : (
                              <span className="line-clamp-2">{worksheet.title}</span>
                            )}
                          </h3>
                          <p className="mt-auto pt-5 text-sm text-primary">
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
