-- CreateTable
CREATE TABLE "PedidoImpressao" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "authorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "paginas" INTEGER NOT NULL,
    "tiragem" INTEGER NOT NULL,
    "temIsbn" BOOLEAN NOT NULL,
    "mioloCor" TEXT NOT NULL,
    "mioloPapel" TEXT NOT NULL,
    "encadernacao" TEXT NOT NULL,
    "capaPapel" TEXT NOT NULL,
    "capaCor" TEXT NOT NULL,
    "laminacao" TEXT NOT NULL,
    "orelhas" BOOLEAN NOT NULL,
    "acabamentos" TEXT[],
    "observacoes" TEXT,
    "capaPath" TEXT NOT NULL,
    "capaNome" TEXT NOT NULL,
    "capaBytes" INTEGER NOT NULL,
    "mioloPath" TEXT NOT NULL,
    "mioloNome" TEXT NOT NULL,
    "mioloBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoImpressao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoImpressao_numero_key" ON "PedidoImpressao"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoImpressao_tokenHash_key" ON "PedidoImpressao"("tokenHash");

-- CreateIndex
CREATE INDEX "PedidoImpressao_authorId_idx" ON "PedidoImpressao"("authorId");

-- AddForeignKey
ALTER TABLE "PedidoImpressao" ADD CONSTRAINT "PedidoImpressao_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
