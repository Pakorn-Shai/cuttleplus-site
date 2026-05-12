"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import type { ThemeSettings } from "@/lib/theme-settings";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  order: number;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

type NavbarClientProps = {
  menuItems: MenuItem[];
  theme: ThemeSettings;
};

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function NavbarClient({ menuItems, theme }: NavbarClientProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/categories/public")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo
            logoUrl={theme.logoUrl}
            logoSize={theme.logoSize}
            showLogo={theme.showLogo}
            showSiteName={theme.showSiteName}
            siteName={theme.siteName}
          />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 sm:flex">
            {menuItems.map((link) =>
              link.href === "/blog" ? (
                <div
                  key={link.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(-1)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <button
                    type="button"
                    className="group relative text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute left-0 top-full w-64 pt-2 transition-all duration-200 ${
                      hoveredCategory !== null
                        ? "visible opacity-100"
                        : "invisible pointer-events-none opacity-0"
                    }`}
                  >
                    <div className="rounded-lg border border-border bg-surface p-2 shadow-lg">
                      <Link
                        href="/blog"
                        className="block rounded-md px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-surface-muted hover:text-primary"
                        onMouseEnter={() => setHoveredCategory(-1)}
                      >
                        All Posts
                      </Link>
                      {categories.length > 0 && (
                        <div className="border-t border-border pt-2">
                          {categories.map((category) => (
                            <div key={category.id}>
                              <Link
                                href={`/blog/${category.slug}`}
                                className="block rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-muted hover:text-primary"
                                onMouseEnter={() => setHoveredCategory(category.id)}
                              >
                                {category.name}
                              </Link>
                              {category.subcategories.length > 0 && (
                                <div className="ml-4">
                                  {category.subcategories.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/blog/${category.slug}/${sub.slug}`}
                                      className="block rounded-md px-4 py-1.5 text-xs text-foreground/60 transition hover:text-primary"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : isExternalHref(link.href) ? (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ) : (
                <Link
                  key={link.id}
                  href={link.href}
                  className="group relative text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <details
            className="relative sm:hidden"
            open={mobileOpen}
            onToggle={(e) => setMobileOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="flex cursor-pointer items-center justify-center rounded-md p-2 text-foreground hover:bg-surface-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </summary>
            <nav className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-lg">
              {menuItems.map((link, index) =>
                link.href === "/blog" ? (
                  <div
                    key={link.id}
                    className={index > 0 ? "border-t border-border pt-2" : undefined}
                  >
                    <Link
                      href="/blog"
                      className="block rounded-md px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-surface-muted hover:text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label} - All Posts
                    </Link>
                    {categories.length > 0 && (
                      <div className="px-4 py-2 text-sm font-semibold text-foreground/60">
                        Categories
                      </div>
                    )}
                    {categories.map((category) => (
                      <div key={category.id}>
                        <Link
                          href={`/blog/${category.slug}`}
                          className="block rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-muted hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          {category.name}
                        </Link>
                        {category.subcategories.length > 0 && (
                          <div>
                            <button
                              className="block w-full rounded-md px-4 py-1.5 text-left text-xs text-foreground/50 transition hover:text-primary"
                              onClick={() =>
                                setMobileCategoryOpen(
                                  mobileCategoryOpen === category.id ? null : category.id
                                )
                              }
                            >
                              {mobileCategoryOpen === category.id ? "Hide" : "Show"} subcategories
                            </button>
                            {mobileCategoryOpen === category.id && (
                              <div className="ml-4">
                                {category.subcategories.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/blog/${category.slug}/${sub.slug}`}
                                    className="block rounded-md px-4 py-1.5 text-xs text-foreground/60 transition hover:text-primary"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : isExternalHref(link.href) ? (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${index > 0 ? "border-t border-border" : ""} block rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-muted hover:text-primary`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`${index > 0 ? "border-t border-border" : ""} block rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-muted hover:text-primary`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}