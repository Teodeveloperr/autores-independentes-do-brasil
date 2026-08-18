-- CreateTable
CREATE TABLE "AuthorMercadoPagoToken" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "publicKey" TEXT,
    "mpUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorMercadoPagoToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorMercadoPagoToken_authorId_key" ON "AuthorMercadoPagoToken"("authorId");

-- AddForeignKey
ALTER TABLE "AuthorMercadoPagoToken" ADD CONSTRAINT "AuthorMercadoPagoToken_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
