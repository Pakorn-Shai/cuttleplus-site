import { AnalyticsTracker } from "@/components/public/analytics-tracker";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ThemePreviewBar } from "@/components/public/theme-preview-bar";
import { getActiveThemeId, getSiteSettings } from "@/core/site/settings";
import { getPreviewThemeId } from "@/core/themes/preview";
import { getTheme } from "@/themes/registry";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [activeThemeId, previewThemeId, settings] = await Promise.all([getActiveThemeId(), getPreviewThemeId(), getSiteSettings()]);
  const theme = getTheme(previewThemeId ?? activeThemeId ?? process.env.NEXT_PUBLIC_THEME_ID);
  const Shell = theme.components.Shell;
  const Header = theme.components.Header ?? SiteHeader;
  const Footer = theme.components.Footer ?? SiteFooter;
  let navItems: { label: string; url: string; visible: boolean }[] = [];
  try { navItems = (JSON.parse(settings.navigationItems) as { label: string; url: string; visible: boolean }[]).filter((item) => item.url !== "/search"); } catch {}
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const siteStructuredData = [
    { "@context": "https://schema.org", "@type": "WebSite", name: settings.siteName, description: settings.siteDescription, url: siteUrl || undefined, ...(siteUrl ? { potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } } : {}) },
    { "@context": "https://schema.org", "@type": "Person", name: settings.siteName, url: siteUrl || undefined, description: settings.siteDescription },
  ];
  return <Shell>
    {previewThemeId && <ThemePreviewBar themeName={theme.manifest.name} isActiveTheme={previewThemeId === activeThemeId} />}
    <Header siteName={settings.siteName} navigationItems={navItems} />
    <main id="main-content">{children}</main>
    <Footer siteName={settings.siteName} footerText={settings.footerText} />
    <AnalyticsTracker />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c") }} />
  </Shell>;
}