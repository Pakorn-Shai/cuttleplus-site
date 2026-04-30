export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CmsShell } from "@/app/_components/cms-shell";
import { prisma } from "@/lib/prisma";

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Check if it's a category first
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (category) {
    return {
      title: `${category.name} | Blog`,
      description: `Browse posts in the ${category.name} category.`,
    };
  }

  // Otherwise, it's a post
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "published",
    },
  });

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  const description = post.meta_description || post.content.replace(/\s+/g, " ").trim().slice(0, 150);

  return {
    title: post.meta_title || post.title,
    description,
    openGraph: {
      title: post.meta_title || post.title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || post.title,
      description,
    },
  };
}

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;

  // Check if it's a category first
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      subcategories: true,
    },
  });

  if (category) {
    // Render category page
    const posts = await prisma.post.findMany({
      where: {
        status: "published",
        categoryId: category.id,
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
        title={category.name}
        description={`Browse posts in the ${category.name} category.`}
        links={[
          { href: "/", label: "Back to home" },
          { href: "/blog", label: "All posts" },
        ]}
      >
        {category.subcategories.length > 0 && (
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
                className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

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
            No posts have been published in this category yet. Check back soon.
          </p>
        )}
      </CmsShell>
    );
  }

  // Otherwise, it's a post
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "published",
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <CmsShell
      eyebrow="Blog post"
      title={post.title}
      description={`Published ${formatPostDate(post.createdAt)}`}
      links={[{ href: "/blog", label: "Back to blog" }]}
    >
      <article className="space-y-6">
        {post.coverImage && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface/60">
            <img
              src={post.coverImage}
              alt={`Cover image for ${post.title}`}
              className="h-auto w-full object-cover"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}
        <div className="prose max-w-none prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
        <Link
          href="/blog"
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Return to blog listing
        </Link>
      </article>
    </CmsShell>
  );
}