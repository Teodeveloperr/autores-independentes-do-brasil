-- CreateTable
CREATE TABLE "LeadEbook" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "ebook" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "origem" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoPedidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEbook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadEbook_email_ebook_key" ON "LeadEbook"("email", "ebook");

-- CreateIndex
CREATE INDEX "LeadEbook_createdAt_idx" ON "LeadEbook"("createdAt");
