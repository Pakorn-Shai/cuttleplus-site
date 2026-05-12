-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'CuttlePlus',
    "siteDescription" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "logoPublicId" TEXT,
    "faviconPublicId" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f766e',
    "accentColor" TEXT NOT NULL DEFAULT '#14b8a6',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "mutedTextColor" TEXT NOT NULL DEFAULT '#6b7280',
    "cardBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "contentWidth" TEXT NOT NULL DEFAULT '1200px',
    "headerStyle" TEXT NOT NULL DEFAULT 'default',
    "cardRadius" TEXT NOT NULL DEFAULT '16px',
    "showSiteName" BOOLEAN NOT NULL DEFAULT true,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showFooterBranding" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
