-- CreateTable
CREATE TABLE "PedidoKitPagamento" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "valorLiquidoCentavos" INTEGER,
    "disponivelEm" TIMESTAMP(3),
    "repasseValorCentavos" INTEGER NOT NULL,
    "repasseStatus" TEXT NOT NULL DEFAULT 'pendente',
    "repasseAsaasTransferId" TEXT,
    "repasseErro" TEXT,
    "repasseEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoKitPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoKitPagamento_asaasPaymentId_key" ON "PedidoKitPagamento"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "PedidoKitPagamento_pedidoId_idx" ON "PedidoKitPagamento"("pedidoId");

-- AddForeignKey
ALTER TABLE "PedidoKitPagamento" ADD CONSTRAINT "PedidoKitPagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
