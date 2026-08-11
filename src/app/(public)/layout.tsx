import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getActiveThemeId, getSiteSettings } from "@/core/site/settings";
import { getTheme } from "@/themes/registry";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [activeThemeId, settings] = await Promise.all([getActiveThemeId(), getSiteSettings()]);
  const theme = getTheme(activeThemeId || process.env.NEXT_PUBLIC_THEME_ID);
  const Shell = theme.components.Shell;
  let navItems: { label: string; url: string; visible: boolean }[] = [];
  try { navItems = JSON.parse(settings.navigationItems) as { label: string; url: string; visible: boolean }[]; } catch {}
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const siteStructuredData = [
    { "@context": "https://schema.org", "@type": "WebSite", name: settings.siteName, description: settings.siteDescription, url: siteUrl || undefined, ...(siteUrl ? { potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } } : {}) },
    { "@context": "https://schema.org", "@type": "Person", name: settings.siteName, url: siteUrl || undefined, description: settings.siteDescription },
  ];
  return <Shell><a href="#main-content" className="skip-nav">ข้ามไปยังเนื้อหาหลัก</a><SiteHeader siteName={settings.siteName} navigationItems={navItems} /><main id="main-content">{children}</main><SiteFooter siteName={settings.siteName} footerText={settings.footerText} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c") }} /></Shell>;
}