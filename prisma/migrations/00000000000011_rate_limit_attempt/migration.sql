-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitAttempt_chave_createdAt_idx" ON "RateLimitAttempt"("chave", "createdAt");
