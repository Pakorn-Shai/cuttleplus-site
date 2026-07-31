import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="container footer-grid">
        <span>© 2026 Knowledge Hub — สร้างไว้เพื่อทบทวนสิ่งที่เรียนรู้</span>
        <span><Link href="/about">About</Link> · <Link href="/admin">Admin prototype</Link> · <a href="/sitemap.xml">Sitemap</a></span>
      </div>
    </footer>
  );
}
