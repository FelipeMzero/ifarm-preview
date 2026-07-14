/*
  Warnings:

  - The `breed_id` column on the `animal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `breed` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `updated_at` to the `breed` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `breed` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_breed_id_fkey";

-- AlterTable
ALTER TABLE "animal" DROP COLUMN "breed_id",
ADD COLUMN     "breed_id" UUID;

-- AlterTable
ALTER TABLE "breed" DROP CONSTRAINT "breed_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deactivated_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "breed_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "animal_breed_id_idx" ON "animal"("breed_id");

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
