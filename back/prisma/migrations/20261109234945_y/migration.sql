/*
  Warnings:

  - You are about to drop the column `available_equipment` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `planned_exercise_ids` on the `user_logs` table. All the data in the column will be lost.
  - You are about to drop the column `planned_meal_ids` on the `user_logs` table. All the data in the column will be lost.
  - You are about to drop the column `customized_at` on the `user_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "available_equipment";

-- AlterTable
ALTER TABLE "user_logs" DROP COLUMN "planned_exercise_ids",
DROP COLUMN "planned_meal_ids";

-- AlterTable
ALTER TABLE "user_plans" DROP COLUMN "customized_at",
ADD COLUMN     "diet_start_date" DATE,
ADD COLUMN     "diet_weeks" INTEGER,
ADD COLUMN     "workout_weeks" INTEGER;

-- CreateIndex
CREATE INDEX "user_plans_coach_id_status_created_at_idx" ON "user_plans"("coach_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "user_plans_user_id_created_at_idx" ON "user_plans"("user_id", "created_at");
-- backfill
UPDATE user_plans SET
  workout_weeks   = (snapshot_exercise->>'durationWeeks')::int,
  diet_weeks      = (snapshot_diet->>'durationWeeks')::int,
  diet_start_date = (snapshot_diet->>'startDate')::date;

-- ⚠️ If a user already has several ACTIVE plans, clean them up before this index.
CREATE UNIQUE INDEX uq_user_plans_one_active
  ON user_plans (user_id) WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX uq_user_plans_open_per_request
  ON user_plans (request_id)
  WHERE request_id IS NOT NULL AND status IN ('DRAFT', 'ACTIVE');