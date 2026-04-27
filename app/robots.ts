import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cuttleplus.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}