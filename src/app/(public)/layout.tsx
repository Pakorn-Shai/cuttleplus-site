import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getTheme } from "@/themes/registry";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const theme = getTheme(process.env.NEXT_PUBLIC_THEME_ID);
  const Shell = theme.components.Shell;
  return <Shell><SiteHeader /><main>{children}</main><SiteFooter /></Shell>;
}
