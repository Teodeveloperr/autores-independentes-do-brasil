-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "valorLiquidoCentavos" INTEGER,
ADD COLUMN     "repasseValorCentavos" INTEGER,
ADD COLUMN     "disponivelEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubscriptionPayment" ADD COLUMN     "disponivelEm" TIMESTAMP(3);
