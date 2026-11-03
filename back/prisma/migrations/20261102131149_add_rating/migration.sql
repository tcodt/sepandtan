/*
  Warnings:

  - You are about to drop the column `rating` on the `workout_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "diet_plans" ADD COLUMN     "avg_rating" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "count_Rating" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_rating" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "workout_plans" DROP COLUMN "rating",
ADD COLUMN     "count_Rating" INTEGER NOT NULL DEFAULT 0;
