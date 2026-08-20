-- CreateTable
CREATE TABLE "AuthorPasskey" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AuthorPasskey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorPasskey_credentialId_key" ON "AuthorPasskey"("credentialId");

-- CreateIndex
CREATE INDEX "AuthorPasskey_authorId_idx" ON "AuthorPasskey"("authorId");

-- AddForeignKey
ALTER TABLE "AuthorPasskey" ADD CONSTRAINT "AuthorPasskey_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
