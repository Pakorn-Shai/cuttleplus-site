import Link from "next/link";
import type { Metadata } from "next";
import { CmsShell } from "@/app/_components/cms-shell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Worksheets | CuttlePlus",
  description: "Browse and download worksheets and resources.",
};

export default async function WorksheetsPage() {
  const worksheets = await prisma.worksheet.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <CmsShell
      eyebrow="Resources"
      title="Worksheets"
      description="Browse and download worksheets and learning resources."
      links={[{ href: "/", label: "Back to home" }, { href: "/blog", label: "Blog" }]}
    >
      {worksheets.length ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((worksheet) => (
            <li key={worksheet.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/70 shadow-sm transition hover:border-primary/50 hover:shadow-md">
                <Link
                  href={worksheet.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="overflow-hidden">
                    <img
                      src={worksheet.imageUrl}
                      alt={worksheet.title}
                      className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-semibold tracking-tight">
                    <Link
                      href={worksheet.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {worksheet.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-primary">
                    <Link
                      href={worksheet.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      Open worksheet
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-8L10 10" />
                      </svg>
                    </Link>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No worksheets have been added yet. Check back soon.
        </p>
      )}
    </CmsShell>
  );
}