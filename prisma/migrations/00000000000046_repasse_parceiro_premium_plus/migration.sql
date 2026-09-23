ALTER TABLE "Admin" ADD COLUMN     "premiumPlusPixKey" TEXT,
ADD COLUMN     "premiumPlusPixKeyType" TEXT;

ALTER TABLE "SubscriptionPayment" ADD COLUMN     "repasseParceiroStatus" TEXT NOT NULL DEFAULT 'pendente',
ADD COLUMN     "repasseParceiroAsaasTransferId" TEXT,
ADD COLUMN     "repasseParceiroValorCentavos" INTEGER,
ADD COLUMN     "repasseParceiroErro" TEXT;
