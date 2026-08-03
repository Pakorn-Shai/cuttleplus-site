import Link from "next/link";
import type { Route } from "next";

export function SiteFooter({ siteName = "Knowledge Hub", footerText = "สร้างไว้เพื่อทบทวนสิ่งที่เรียนรู้" }: { siteName?: string; footerText?: string }) {
  return (
    <footer className="public-footer">
      <div className="container footer-grid">
        <span>© {new Date().getFullYear()} {siteName} — {footerText}</span>
        <span><Link href={"/series" as Route}>Series</Link> · <Link href={"/collections" as Route}>Collections</Link> · <Link href="/about">About</Link> · <Link href="/admin">Admin</Link> · <a href="/sitemap.xml">Sitemap</a></span>
      </div>
    </footer>
  );
}
