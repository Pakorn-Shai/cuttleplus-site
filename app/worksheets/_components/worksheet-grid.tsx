import { isHttpUrl } from "@/lib/urls";

type WorksheetCard = {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  category: {
    name: string;
    slug: string;
  } | null;
  subcategory: {
    name: string;
    slug: string;
  } | null;
};

type WorksheetGridProps = {
  worksheets: WorksheetCard[];
  emptyMessage?: string;
};

export function WorksheetGrid({ worksheets, emptyMessage = "No worksheets match this filter yet. Check back soon." }: WorksheetGridProps) {
  if (!worksheets.length) {
    return (
      <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
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
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                  {worksheet.category ? worksheet.category.name : "Uncategorized"}
                  {worksheet.subcategory ? ` / ${worksheet.subcategory.name}` : ""}
                </p>
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
  );
}
