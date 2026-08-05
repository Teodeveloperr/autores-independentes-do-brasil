-- AlterTable
ALTER TABLE "Author" ALTER COLUMN "senhaHash" DROP NOT NULL;
ALTER TABLE "Author" ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_googleId_key" ON "Author"("googleId");
