-- AlterTable
ALTER TABLE "InscricaoPremio" ADD COLUMN     "asaasInvoiceUrl" TEXT,
ADD COLUMN     "asaasPaymentId" TEXT,
ADD COLUMN     "disponivelEm" TIMESTAMP(3),
ADD COLUMN     "emailPagoEnviadoEm" TIMESTAMP(3),
ADD COLUMN     "formaPagamento" TEXT NOT NULL DEFAULT 'comprovante',
ADD COLUMN     "nomesArquivos" TEXT,
ADD COLUMN     "pagamentoStatus" TEXT NOT NULL DEFAULT 'comprovante',
ADD COLUMN     "pagoEm" TIMESTAMP(3),
ADD COLUMN     "repasseAsaasTransferId" TEXT,
ADD COLUMN     "repasseEm" TIMESTAMP(3),
ADD COLUMN     "repasseErro" TEXT,
ADD COLUMN     "repasseStatus" TEXT,
ADD COLUMN     "repasseValorCentavos" INTEGER,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "valorCentavos" INTEGER,
ADD COLUMN     "valorLiquidoCentavos" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPremio_token_key" ON "InscricaoPremio"("token");

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPremio_asaasPaymentId_key" ON "InscricaoPremio"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "InscricaoPremio_pagamentoStatus_idx" ON "InscricaoPremio"("pagamentoStatus");
