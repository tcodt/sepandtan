/*
  Warnings:

  - A unique constraint covering the columns `[day_id,order]` on the table `workout_day_exercises` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'BOTH';

-- DropIndex
DROP INDEX "workout_day_exercises_day_id_order_idx";

-- AlterTable
ALTER TABLE "workout_days" ADD COLUMN     "workout_phase_id" TEXT;

-- CreateTable
CREATE TABLE "workout_phases" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_week" INTEGER NOT NULL,
    "end_week" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "workout_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_phases_plan_id_order_idx" ON "workout_phases"("plan_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "workout_phases_plan_id_start_week_key" ON "workout_phases"("plan_id", "start_week");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_status_settlement_date_idx" ON "wallet_transactions"("type", "status", "settlement_date");

-- CreateIndex
CREATE INDEX "workout_day_exercises_day_id_idx" ON "workout_day_exercises"("day_id");

-- CreateIndex
CREATE INDEX "workout_day_exercises_exercise_id_idx" ON "workout_day_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_day_exercises_day_id_order_key" ON "workout_day_exercises"("day_id", "order");

-- CreateIndex
CREATE INDEX "workout_days_plan_id_idx" ON "workout_days"("plan_id");

-- CreateIndex
CREATE INDEX "workout_days_workout_phase_id_idx" ON "workout_days"("workout_phase_id");

-- CreateIndex
CREATE INDEX "workout_plans_training_goal_id_idx" ON "workout_plans"("training_goal_id");

-- CreateIndex
CREATE INDEX "workout_plans_source_is_published_idx" ON "workout_plans"("source", "is_published");

-- AddForeignKey
ALTER TABLE "workout_phases" ADD CONSTRAINT "workout_phases_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_workout_phase_id_fkey" FOREIGN KEY ("workout_phase_id") REFERENCES "workout_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
