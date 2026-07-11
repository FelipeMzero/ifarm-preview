/*
  Warnings:

  - You are about to drop the column `atualizado_em` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_em` on the `usuario_conta` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `usuario_conta` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_em` on the `usuario_sessao` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `usuario_sessao` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_em` on the `usuario_verificacao` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `usuario_verificacao` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `usuario_conta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `usuario_sessao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `usuario_verificacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "atualizado_em",
DROP COLUMN "criado_em",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "usuario_conta" DROP COLUMN "atualizado_em",
DROP COLUMN "criado_em",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "usuario_sessao" DROP COLUMN "atualizado_em",
DROP COLUMN "criado_em",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "usuario_verificacao" DROP COLUMN "atualizado_em",
DROP COLUMN "criado_em",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
