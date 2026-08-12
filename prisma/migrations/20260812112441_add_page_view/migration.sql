-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_date_idx" ON "PageView"("date");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");
