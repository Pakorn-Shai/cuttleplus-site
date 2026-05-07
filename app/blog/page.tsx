export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/app/_components/article-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "บทความเทคโนโลยี | CuttlePlus",
  description:
    "รวมบทความเทคโนโลยี รีวิวเครื่องมือ และความรู้ที่ช่วยให้คุณเก่งขึ้น อัปเดตเนื้อหาใหม่อย่างสม่ำเสมอ",

  openGraph: {
    title: "บทความเทคโนโลยี | CuttlePlus",
    description:
      "รวมบทความเทคโนโลยี รีวิวเครื่องมือ และความรู้ที่ช่วยให้คุณเก่งขึ้น",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "บทความเทคโนโลยี | CuttlePlus",
    description:
      "รวมบทความเทคโนโลยี รีวิวเครื่องมือ และความรู้ที่ช่วยให้คุณเก่งขึ้น",
  },
};

export default async function BlogIndexPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
    },
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-hero-from via-hero-via to-hero-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.32),transparent_36%),radial-gradient(circle_at_18%_28%,rgba(20,184,166,0.38),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.2),transparent_26%)]" />
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -left-24 bottom-4 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,63,55,0.18),rgba(3,63,55,0.02)_45%,rgba(3,63,55,0.28))]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2288%22%20height%3D%2288%22%20viewBox%3D%220%200%2088%2088%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.12%22%3E%3Cpath%20d%3D%22M0%2044h88M44%200v88%22/%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2244%22%20r%3D%221.5%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.16%22%20stroke%3D%22none%22/%3E%3C/g%3E%3C/svg%3E')] opacity-25 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_72%,transparent)]" />
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24 md:py-28">
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-6 h-px w-28 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              CuttlePlus Journal
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
              Blog
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/90 drop-shadow-sm sm:mt-6">
              Read the latest articles from CuttlePlus on technology, tools,
              tutorials, and practical ideas made simple.
            </p>
            <div className="mt-7 sm:mt-10">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-white/40 bg-white px-6 py-3 font-semibold text-primary shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-surface-muted hover:shadow-2xl hover:shadow-emerald-950/25"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="bg-background py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Latest Articles
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Fresh reads from CuttlePlus, curated for people who want useful
                tech knowledge without the noise.
              </p>
            </div>
            <p className="text-sm font-medium text-primary">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>

          {posts.length ? (
            <ul className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {posts.map((post) => (
                <li key={post.id} className="flex">
                  <ArticleCard post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v10.5A1.125 1.125 0 0 1 19.875 20.25H4.125A1.125 1.125 0 0 1 3 19.125V5.625C3 5.004 3.504 4.5 4.125 4.5H15"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                No posts yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                New CuttlePlus articles will appear here as soon as they are
                published.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
