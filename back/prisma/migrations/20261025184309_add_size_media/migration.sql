/*
  Warnings:

  - The values [BANNER,AVATAR,TICKET] on the enum `TypeMedia` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `foods` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TypeMedia_new" AS ENUM ('VIDEO', 'IMAGE', 'VOICE', 'FILE', 'OTHER');
ALTER TABLE "public"."media" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "media" ALTER COLUMN "type" TYPE "TypeMedia_new" USING ("type"::text::"TypeMedia_new");
ALTER TYPE "TypeMedia" RENAME TO "TypeMedia_old";
ALTER TYPE "TypeMedia_new" RENAME TO "TypeMedia";
DROP TYPE "public"."TypeMedia_old";
ALTER TABLE "media" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- DropIndex
DROP INDEX "exercises_category_level_idx";

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "category",
ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "foods" DROP COLUMN "category",
ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "size" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "exercises_category_id_level_idx" ON "exercises"("category_id", "level");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
