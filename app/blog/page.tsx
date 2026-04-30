import Link from "next/link";
import type { Metadata } from "next";
import { CmsShell } from "@/app/_components/cms-shell";
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
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/60 transition hover:border-primary/50 hover:shadow-sm">
                {post.coverImage ? (
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={`Cover image for ${post.title}`}
                        className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </Link>
                ) : (
                  <div className="h-48 bg-surface/80" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold tracking-tight">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                    {getExcerpt(post.content)}
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                    {formatPostDate(post.createdAt)}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No posts have been published yet. Check back soon.
        </p>
      )}
    </CmsShell>
  );
}
