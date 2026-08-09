import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getActiveThemeId, getSiteSettings } from "@/core/site/settings";
import { getTheme } from "@/themes/registry";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [activeThemeId, settings] = await Promise.all([getActiveThemeId(), getSiteSettings()]);
  const theme = getTheme(activeThemeId || process.env.NEXT_PUBLIC_THEME_ID);
  const Shell = theme.components.Shell;
  return <Shell><a href="#main-content" className="skip-nav">ข้ามไปยังเนื้อหาหลัก</a><SiteHeader siteName={settings.siteName} /><main id="main-content">{children}</main><SiteFooter siteName={settings.siteName} footerText={settings.footerText} /></Shell>;
}
