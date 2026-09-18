-- CreateTable
CREATE TABLE "ChatMensagem" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMensagem_createdAt_idx" ON "ChatMensagem"("createdAt");

-- AddForeignKey
ALTER TABLE "ChatMensagem" ADD CONSTRAINT "ChatMensagem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
