/*
  Warnings:

  - You are about to drop the `UserLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeMedia" ADD VALUE 'TICKET';
ALTER TYPE "TypeMedia" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "UserLog" DROP CONSTRAINT "UserLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserLog" DROP CONSTRAINT "UserLog_user_plan_id_fkey";

-- AlterTable
ALTER TABLE "media" ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- DropTable
DROP TABLE "UserLog";

-- CreateTable
CREATE TABLE "user_logs" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "user_plan_id" TEXT,
    "date" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "planned_exercise_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "done_exercise_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planned_exercises" INTEGER NOT NULL DEFAULT 0,
    "done_exercises" INTEGER NOT NULL DEFAULT 0,
    "extra_exercises" JSONB NOT NULL DEFAULT '[]',
    "calories_burned" INTEGER,
    "planned_meal_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "done_meal_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planned_meals" INTEGER NOT NULL DEFAULT 0,
    "done_meals" INTEGER NOT NULL DEFAULT 0,
    "extra_meals" JSONB NOT NULL DEFAULT '[]',
    "calories_planned" INTEGER,
    "calories_consumed" INTEGER,
    "protein_g" INTEGER,
    "carbs_g" INTEGER,
    "fat_g" INTEGER,
    "user_note" TEXT,
    "coach_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_logs_user_plan_id_idx" ON "user_logs"("user_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_logs_user_id_date_key" ON "user_logs"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_plan_id_fkey" FOREIGN KEY ("user_plan_id") REFERENCES "user_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
