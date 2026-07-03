/*
  Warnings:

  - Made the column `brinco` on table `Animal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Animal" ALTER COLUMN "brinco" SET NOT NULL;
