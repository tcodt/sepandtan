/*
  Warnings:

  - You are about to drop the column `goal` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `workout_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "goal";

-- AlterTable
ALTER TABLE "diet_plans" DROP COLUMN "goal",
ADD COLUMN     "training_goal_id" TEXT;

-- AlterTable
ALTER TABLE "workout_plans" DROP COLUMN "goal",
ADD COLUMN     "training_goal_id" TEXT;

-- DropEnum
DROP TYPE "Goal";

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_training_goal_id_fkey" FOREIGN KEY ("training_goal_id") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_training_goal_id_fkey" FOREIGN KEY ("training_goal_id") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
