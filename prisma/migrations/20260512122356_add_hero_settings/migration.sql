-- AlterTable
ALTER TABLE "SiteSetting"
ADD COLUMN "showHero" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "heroTitle" TEXT NOT NULL DEFAULT 'CuttlePlus',
ADD COLUMN "heroSubtitle" TEXT NOT NULL DEFAULT 'Read about technology, tools, and tutorials made simple.',
ADD COLUMN "heroButtonText" TEXT NOT NULL DEFAULT 'Start Reading',
ADD COLUMN "heroButtonHref" TEXT NOT NULL DEFAULT '/blog',
ADD COLUMN "heroStyle" TEXT NOT NULL DEFAULT 'gradient',
ADD COLUMN "heroBackgroundImageUrl" TEXT,
ADD COLUMN "heroOverlay" BOOLEAN NOT NULL DEFAULT true;