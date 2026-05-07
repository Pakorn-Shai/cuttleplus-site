-- AlterTable
ALTER TABLE "Worksheet" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "subcategoryId" INTEGER;

-- CreateTable
CREATE TABLE "WorksheetCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorksheetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetSubcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorksheetSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorksheetCategory_name_key" ON "WorksheetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorksheetCategory_slug_key" ON "WorksheetCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorksheetSubcategory_categoryId_slug_key" ON "WorksheetSubcategory"("categoryId", "slug");

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorksheetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "WorksheetSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetSubcategory" ADD CONSTRAINT "WorksheetSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorksheetCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
