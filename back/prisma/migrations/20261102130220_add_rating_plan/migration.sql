-- AlterTable
ALTER TABLE "workout_plans" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_rating" INTEGER NOT NULL DEFAULT 0;
