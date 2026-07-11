-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "ban_expires" TIMESTAMP(3),
ADD COLUMN     "ban_reason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "usuario_sessao" ADD COLUMN     "impersonated_by" TEXT;
