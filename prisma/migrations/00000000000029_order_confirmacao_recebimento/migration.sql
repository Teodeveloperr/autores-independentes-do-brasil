-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "enviadoEm" TIMESTAMP(3),
ADD COLUMN     "confirmacaoTokenHash" TEXT,
ADD COLUMN     "confirmadoEm" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_confirmacaoTokenHash_key" ON "Order"("confirmacaoTokenHash");
