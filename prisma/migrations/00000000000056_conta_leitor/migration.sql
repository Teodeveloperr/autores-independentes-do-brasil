-- CreateTable
CREATE TABLE "Leitor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "senhaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcessoEm" TIMESTAMP(3),

    CONSTRAINT "Leitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeitorLink" (
    "id" TEXT NOT NULL,
    "leitorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeitorLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeitorSessao" (
    "id" TEXT NOT NULL,
    "leitorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "aparelho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeitorSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcessoEbook" (
    "id" TEXT NOT NULL,
    "leitorId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "orderId" TEXT,
    "concedidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadoEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,

    CONSTRAINT "AcessoEbook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Leitor_email_key" ON "Leitor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeitorLink_tokenHash_key" ON "LeitorLink"("tokenHash");

-- CreateIndex
CREATE INDEX "LeitorLink_leitorId_idx" ON "LeitorLink"("leitorId");

-- CreateIndex
CREATE UNIQUE INDEX "LeitorSessao_tokenHash_key" ON "LeitorSessao"("tokenHash");

-- CreateIndex
CREATE INDEX "LeitorSessao_leitorId_idx" ON "LeitorSessao"("leitorId");

-- CreateIndex
CREATE INDEX "AcessoEbook_bookId_idx" ON "AcessoEbook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "AcessoEbook_leitorId_bookId_key" ON "AcessoEbook"("leitorId", "bookId");

-- AddForeignKey
ALTER TABLE "LeitorLink" ADD CONSTRAINT "LeitorLink_leitorId_fkey" FOREIGN KEY ("leitorId") REFERENCES "Leitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeitorSessao" ADD CONSTRAINT "LeitorSessao_leitorId_fkey" FOREIGN KEY ("leitorId") REFERENCES "Leitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcessoEbook" ADD CONSTRAINT "AcessoEbook_leitorId_fkey" FOREIGN KEY ("leitorId") REFERENCES "Leitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcessoEbook" ADD CONSTRAINT "AcessoEbook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcessoEbook" ADD CONSTRAINT "AcessoEbook_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
