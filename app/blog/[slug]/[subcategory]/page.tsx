export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmsShell } from "@/app/_components/cms-shell";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; subcategory: string }>;
}): Promise<Metadata> {
  const { slug: categorySlug, subcategory: subSlug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      subcategories: true,
    },
  });

  if (!category) {
    return { title: "Category Not Found" };
  }

  const subcategory = category.subcategories.find(
    (sub) => sub.slug === subSlug
  );

  if (!subcategory) {
    return { title: "Subcategory Not Found" };
  }

  return {
    title: `${subcategory.name} | ${category.name} | Blog`,
    description: `Browse posts in the ${subcategory.name} subcategory.`,
  };
}

type SubcategoryPageProps = {
  params: Promise<{ slug: string; subcategory: string }>;
};

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { slug: categorySlug, subcategory: subSlug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      subcategories: true,
    },
  });

  if (!category) {
    notFound();
  }

  const subcategory = category.subcategories.find(
    (sub) => sub.slug === subSlug
  );

  if (!subcategory) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      subcategoryId: subcategory.id,
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
    <CmsShell
      eyebrow="Public blog"
      title={subcategory.name}
      description={`Browse posts in the ${subcategory.name} subcategory.`}
      links={[
        { href: "/", label: "Back to home" },
        { href: "/blog", label: "All posts" },
        { href: `/blog/${category.slug}`, label: category.name },
      ]}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/blog/${category.slug}`}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          All
        </Link>
        {category.subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/blog/${category.slug}/${sub.slug}`}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              sub.slug === subSlug
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
            }`}
          >
            {sub.name}
          </Link>
        ))}
      </div>

      {posts.length ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/60 shadow-sm transition-all duration-300 md:hover:-translate-y-1 md:hover:border-primary/40 md:hover:shadow-xl md:hover:shadow-primary/10">
                {post.coverImage ? (
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={`Cover image for ${post.title}`}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                      {formatPostDate(post.createdAt)}
                    </span>
                    {post.subcategory && (
                      <Link
                        href={`/blog/${category.slug}/${post.subcategory.slug}`}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        {post.subcategory.name}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No posts have been published in this subcategory yet. Check back soon.
        </p>
      )}
    </CmsShell>
  );
}