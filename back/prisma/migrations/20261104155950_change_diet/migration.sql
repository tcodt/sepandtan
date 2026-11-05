/*
  Warnings:

  - You are about to drop the column `day_index` on the `diet_days` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[diet_phase_id,weekday]` on the table `diet_days` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `diet_phase_id` to the `diet_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekday` to the `diet_days` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "diet_days_plan_id_day_index_key";

-- AlterTable
ALTER TABLE "diet_days" DROP COLUMN "day_index",
ADD COLUMN     "diet_phase_id" TEXT NOT NULL,
ADD COLUMN     "weekday" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "diet_phases" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_week" INTEGER NOT NULL,
    "end_week" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "target_calories" INTEGER,
    "target_protein_g" INTEGER,
    "target_carbs_g" INTEGER,
    "target_fat_g" INTEGER,

    CONSTRAINT "diet_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diet_phases_plan_id_order_idx" ON "diet_phases"("plan_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "diet_phases_plan_id_start_week_key" ON "diet_phases"("plan_id", "start_week");

-- CreateIndex
CREATE INDEX "diet_days_plan_id_idx" ON "diet_days"("plan_id");

-- CreateIndex
CREATE INDEX "diet_days_diet_phase_id_idx" ON "diet_days"("diet_phase_id");

-- CreateIndex
CREATE UNIQUE INDEX "diet_days_diet_phase_id_weekday_key" ON "diet_days"("diet_phase_id", "weekday");

-- CreateIndex
CREATE INDEX "diet_meal_items_food_id_idx" ON "diet_meal_items"("food_id");

-- CreateIndex
CREATE INDEX "diet_plans_source_is_published_idx" ON "diet_plans"("source", "is_published");

-- AddForeignKey
ALTER TABLE "diet_phases" ADD CONSTRAINT "diet_phases_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_days" ADD CONSTRAINT "diet_days_diet_phase_id_fkey" FOREIGN KEY ("diet_phase_id") REFERENCES "diet_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
