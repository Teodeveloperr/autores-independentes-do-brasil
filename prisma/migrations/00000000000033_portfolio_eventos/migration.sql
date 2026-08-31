-- CreateTable
CREATE TABLE "PortfolioEvento" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioEvento_authorId_idx" ON "PortfolioEvento"("authorId");

-- AddForeignKey
ALTER TABLE "PortfolioEvento" ADD CONSTRAINT "PortfolioEvento_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
