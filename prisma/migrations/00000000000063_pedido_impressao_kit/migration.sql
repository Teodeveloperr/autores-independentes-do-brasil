-- Pedido de impressão feito a partir de um kit da Bienal (Prata/Ouro): fica ligado ao kit, e cada kit
-- tem no máximo um pedido de impressão.
ALTER TABLE "PedidoImpressao" ADD COLUMN "pedidoKitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PedidoImpressao_pedidoKitId_key" ON "PedidoImpressao"("pedidoKitId");

-- AddForeignKey
ALTER TABLE "PedidoImpressao" ADD CONSTRAINT "PedidoImpressao_pedidoKitId_fkey" FOREIGN KEY ("pedidoKitId") REFERENCES "PedidoKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
