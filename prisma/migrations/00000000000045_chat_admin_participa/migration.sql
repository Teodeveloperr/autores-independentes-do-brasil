-- AlterTable
ALTER TABLE "ChatMensagem" ALTER COLUMN "authorId" DROP NOT NULL,
ADD COLUMN     "deAdmin" BOOLEAN NOT NULL DEFAULT false;
