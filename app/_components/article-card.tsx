import Link from "next/link";

type ArticleCardPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  createdAt: Date;
  category?: {
    name: string;
    slug: string;
  } | null;
  subcategory?: {
    name: string;
    slug: string;
  } | null;
};

type ArticleCardProps = {
  post: ArticleCardPost;
  category?: {
    name: string;
    slug: string;
  } | null;
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

export function ArticleCard({ post, category }: ArticleCardProps) {
  const cardCategory = category ?? post.category ?? null;
  const badge = post.subcategory ?? cardCategory;
  const badgeHref = post.subcategory && cardCategory
    ? `/blog/${cardCategory.slug}/${post.subcategory.slug}`
    : cardCategory
      ? `/blog/${cardCategory.slug}`
      : null;

  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 md:hover:-translate-y-1 md:hover:border-primary/40 md:hover:shadow-xl md:hover:shadow-primary/10">
      {post.coverImage ? (
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
            <img
              src={post.coverImage}
              alt={`Cover image for ${post.title}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
      ) : (
        <div className="aspect-[16/10] bg-surface-muted/70" />
      )}
      <div className="flex flex-1 flex-col p-5">
        {badge && (
          badgeHref ? (
            <Link
              href={badgeHref}
              className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              {badge.name}
            </Link>
          ) : (
            <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {badge.name}
            </span>
          )
        )}
        <h3 className="min-h-[3rem] text-base font-semibold leading-6 tracking-tight sm:text-lg">
          <Link
            href={`/blog/${post.slug}`}
            className="line-clamp-2 underline-offset-4 hover:underline"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {getExcerpt(post.content)}
        </p>
        <div className="mt-auto pt-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            {formatPostDate(post.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
