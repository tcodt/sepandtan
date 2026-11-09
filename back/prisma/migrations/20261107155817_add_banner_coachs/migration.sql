/*
  Warnings:

  - The `banner` column on the `coaches` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "coaches" DROP COLUMN "banner",
ADD COLUMN     "banner" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "coach_id" TEXT;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
