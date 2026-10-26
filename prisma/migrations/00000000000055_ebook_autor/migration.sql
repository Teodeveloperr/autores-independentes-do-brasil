-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "ebookAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "ebookErro" TEXT,
ADD COLUMN     "ebookPaginas" INTEGER,
ADD COLUMN     "ebookPrefixo" TEXT,
ADD COLUMN     "ebookStatus" TEXT,
ADD COLUMN     "formato" TEXT NOT NULL DEFAULT 'fisico';

-- CreateTable
CREATE TABLE "EbookPagina" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "caminho" TEXT NOT NULL,
    "largura" INTEGER NOT NULL,
    "altura" INTEGER NOT NULL,

    CONSTRAINT "EbookPagina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EbookPagina_bookId_numero_key" ON "EbookPagina"("bookId", "numero");

-- AddForeignKey
ALTER TABLE "EbookPagina" ADD CONSTRAINT "EbookPagina_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
