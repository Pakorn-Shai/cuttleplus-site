import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getThemeCssText } from "@/config/theme";
import { Navbar } from "@/components/Navbar";
import { getThemeCssVariables, getThemeSettings } from "@/lib/theme-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getThemeSettings();

  return {
    title: {
      default: theme.siteName,
      template: `%s | ${theme.siteName}`,
    },
    description: theme.siteDescription,
    icons: {
      icon: theme.faviconUrl ?? "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style id="theme-config">{getThemeCssText()}</style>
      </head>
      <body className="min-h-full flex flex-col" style={getThemeCssVariables(theme)}>
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
