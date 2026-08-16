import Link from "next/link";
import type { Route } from "next";
import type { ThemeFooterProps } from "@/core/themes/contracts";

export function EditorialFooter({ siteName, footerText }: ThemeFooterProps) {
  return (
    <footer className="ed-footer">
      <div className="container">
        <p className="ed-footer-colophon">{siteName}</p>
        <p className="ed-footer-text">{footerText}</p>
        <nav className="ed-footer-links" aria-label="ลิงก์ท้ายหน้า">
          <Link href={"/knowledge" as Route}>คลังความรู้</Link>
          <Link href={"/series" as Route}>Series</Link>
          <Link href={"/collections" as Route}>Collections</Link>
          <Link href="/about">About</Link>
          <Link href="/admin">Admin</Link>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>
        <p className="ed-footer-fineprint">© {new Date().getFullYear()} {siteName} — สงวนลิขสิทธิ์</p>
      </div>
    </footer>
  );
}