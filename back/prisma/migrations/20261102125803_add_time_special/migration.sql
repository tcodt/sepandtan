/*
  Warnings:

  - Added the required column `year` to the `coach_achievements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `foods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coach_achievements" DROP COLUMN "year",
ADD COLUMN     "year" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "foods" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "specialties" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "training_goal" ADD COLUMN     "sort_order" INTEGER DEFAULT 0;

-- DropEnum
DROP TYPE "Status";

-- CreateIndex
CREATE INDEX "coach_achievements_year_idx" ON "coach_achievements"("year");
