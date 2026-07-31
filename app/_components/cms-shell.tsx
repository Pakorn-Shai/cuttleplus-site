import Link from "next/link";
import type { ReactNode } from "react";

type ShellLink = {
  href: string;
  label: string;
};

type CmsShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  links?: ShellLink[];
};

export function CmsShell({
  eyebrow,
  title,
  description,
  children,
  links,
}: CmsShellProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
      <section className="rounded-2xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          {description}
        </p>

        {links?.length ? (
          <nav className="mt-6 flex flex-wrap gap-3" aria-label="Quick links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {children ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-4">
            {children}
          </div>
        ) : null}
      </section>
    </main>
  );
}
