-- CreateTable: guarda o token de acesso do Melhor Envio (uma linha única, id "singleton")
CREATE TABLE "MelhorEnvioToken" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MelhorEnvioToken_pkey" PRIMARY KEY ("id")
);
