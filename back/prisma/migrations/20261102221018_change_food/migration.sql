/*
  Warnings:

  - You are about to drop the column `category_id` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `foods` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `foods` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "foods" DROP CONSTRAINT "foods_category_id_fkey";

-- AlterTable
ALTER TABLE "foods" DROP COLUMN "category_id",
DROP COLUMN "is_active",
ALTER COLUMN "calories_per_100g" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "foods_name_key" ON "foods"("name");
