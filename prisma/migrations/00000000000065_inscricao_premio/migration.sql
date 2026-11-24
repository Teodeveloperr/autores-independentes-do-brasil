-- CreateTable
CREATE TABLE "InscricaoPremio" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeArtistico" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "pasta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoPremio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPremio_pasta_key" ON "InscricaoPremio"("pasta");

-- CreateIndex
CREATE INDEX "InscricaoPremio_createdAt_idx" ON "InscricaoPremio"("createdAt");
