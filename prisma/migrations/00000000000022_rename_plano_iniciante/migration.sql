-- Rename plan "Gratuito" to "Iniciante" (data + default)
UPDATE "Author" SET "plano" = 'Iniciante' WHERE "plano" = 'Gratuito';

-- AlterTable
ALTER TABLE "Author" ALTER COLUMN "plano" SET DEFAULT 'Iniciante';
