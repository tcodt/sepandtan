/*
  Warnings:

  - You are about to drop the column `count_Rating` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to alter the column `avg_rating` on the `diet_plans` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(3,2)`.
  - You are about to drop the column `count_Rating` on the `workout_plans` table. All the data in the column will be lost.
  - You are about to alter the column `avg_rating` on the `workout_plans` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(3,2)`.

*/
-- DropIndex
DROP INDEX "workout_plans_is_published_idx";

-- AlterTable
ALTER TABLE "diet_plans" DROP COLUMN "count_Rating",
ADD COLUMN     "count_rating" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "avg_rating" SET DEFAULT 0,
ALTER COLUMN "avg_rating" SET DATA TYPE DECIMAL(3,2);

-- AlterTable
ALTER TABLE "workout_plans" DROP COLUMN "count_Rating",
ADD COLUMN     "count_rating" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "avg_rating" SET DEFAULT 0,
ALTER COLUMN "avg_rating" SET DATA TYPE DECIMAL(3,2);

-- CreateIndex
CREATE INDEX "workout_plans_is_published_status_avg_rating_idx" ON "workout_plans"("is_published", "status", "avg_rating");

-- CreateIndex
CREATE INDEX "workout_plans_avg_rating_idx" ON "workout_plans"("avg_rating");

-- CreateIndex
CREATE INDEX "workout_plans_is_published_avg_rating_idx" ON "workout_plans"("is_published", "avg_rating");
