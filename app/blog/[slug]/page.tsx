export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CmsShell } from "@/app/_components/cms-shell";
import { prisma } from "@/lib/prisma";

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: "published",
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  const description = post.content.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: post.title,
    description,
  };
}

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(date);
}

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

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
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white/60 dark:border-white/15 dark:bg-white/5">
            <img
              src={post.coverImage}
              alt={`Cover image for ${post.title}`}
              className="h-auto w-full object-cover"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}
        <div className="prose max-w-none dark:prose-invert prose-a:text-emerald-700 prose-a:underline-offset-4 hover:prose-a:underline dark:prose-a:text-emerald-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
        <Link
          href="/blog"
          className="inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          ← Return to blog listing
        </Link>
      </article>
    </CmsShell>
  );
}
