-- Pessoa: rename audit columns to Portuguese, drop unused index, add desativado_em
DROP INDEX "pessoa_deleted_at_idx";
ALTER TABLE "pessoa" RENAME COLUMN "created_at" TO "criado_em";
ALTER TABLE "pessoa" RENAME COLUMN "updated_at" TO "atualizado_em";
ALTER TABLE "pessoa" RENAME COLUMN "deleted_at" TO "excluido_em";
ALTER TABLE "pessoa" ADD COLUMN "desativado_em" TIMESTAMP(3);

-- Animal: rename audit columns to Portuguese, add excluido_em (soft delete)
ALTER TABLE "animal" RENAME COLUMN "created_at" TO "criado_em";
ALTER TABLE "animal" RENAME COLUMN "updated_at" TO "atualizado_em";
ALTER TABLE "animal" ADD COLUMN "excluido_em" TIMESTAMP(3);
