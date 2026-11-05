/*
  Warnings:

  - A unique constraint covering the columns `[workout_phase_id,day_index]` on the table `workout_days` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "workout_days_plan_id_day_index_key";

-- CreateIndex
CREATE UNIQUE INDEX "workout_days_workout_phase_id_day_index_key" ON "workout_days"("workout_phase_id", "day_index");
