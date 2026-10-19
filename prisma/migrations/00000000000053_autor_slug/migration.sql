-- AlterTable
ALTER TABLE "Author" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");
