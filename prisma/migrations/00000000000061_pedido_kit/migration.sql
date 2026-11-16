-- CreateTable
CREATE TABLE "PedidoKit" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "kit" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_pagamento',
    "asaasCustomerId" TEXT,
    "asaasPaymentId" TEXT,
    "asaasInstallmentId" TEXT,
    "asaasInvoiceUrl" TEXT,
    "valorLiquidoCentavos" INTEGER,
    "pagoEm" TIMESTAMP(3),
    "emailPagoEnviadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoKit_numero_key" ON "PedidoKit"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoKit_token_key" ON "PedidoKit"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoKit_asaasPaymentId_key" ON "PedidoKit"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "PedidoKit_asaasInstallmentId_idx" ON "PedidoKit"("asaasInstallmentId");
