-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisit_data_key" ON "SiteVisit"("data");
