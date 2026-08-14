-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "totpSecret" TEXT,
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
