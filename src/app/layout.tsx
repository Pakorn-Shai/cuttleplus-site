import type { Metadata, Viewport } from "next";
import { getSiteSettings } from "@/core/site/settings";
import "./globals.css";

const isPreview = process.env.VERCEL_ENV === "preview" || process.env.PREVIEW_ENV === "true";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: settings.siteName, template: `%s · ${settings.siteName}` },
    description: settings.siteDescription,
    ...(isPreview && {
      robots: { index: false, follow: false, noarchive: true, nosnippet: true },
    }),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffefc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
