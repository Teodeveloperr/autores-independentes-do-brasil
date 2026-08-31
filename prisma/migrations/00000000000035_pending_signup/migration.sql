-- CreateTable
CREATE TABLE "PendingSignup" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "generos" TEXT[],
    "cidade" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "planoSlug" TEXT NOT NULL,
    "planoNome" TEXT NOT NULL,
    "ciclo" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "asaasPixCustomerId" TEXT NOT NULL,
    "asaasPixAutoAuthorizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_email_key" ON "PendingSignup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_asaasPixAutoAuthorizationId_key" ON "PendingSignup"("asaasPixAutoAuthorizationId");
