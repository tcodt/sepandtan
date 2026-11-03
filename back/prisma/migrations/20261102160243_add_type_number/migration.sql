/*
  Warnings:

  - You are about to alter the column `height_cm` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(7,2)`.
  - You are about to alter the column `current_weight_kg` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(7,2)`.
  - You are about to alter the column `target_weight_kg` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(7,2)`.
  - You are about to alter the column `avg_coach_rating` on the `coach_ratings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(3,2)`.
  - You are about to alter the column `coach_rating_total` on the `coach_ratings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `avg_plan_rating` on the `coach_ratings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(3,2)`.
  - You are about to alter the column `plan_rating_total` on the `coach_ratings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `quantity_grams` on the `diet_meal_items` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to alter the column `calories_per_100g` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to alter the column `protein_per_100g` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to alter the column `carbs_per_100g` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to alter the column `fat_per_100g` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to drop the column `status` on the `workout_plans` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "workout_plans_is_published_status_avg_rating_idx";

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "height_cm" SET DATA TYPE DECIMAL(7,2),
ALTER COLUMN "current_weight_kg" SET DATA TYPE DECIMAL(7,2),
ALTER COLUMN "target_weight_kg" SET DATA TYPE DECIMAL(7,2);

-- AlterTable
ALTER TABLE "coach_ratings" ADD COLUMN     "avg_diet_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "diet_rating_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
ALTER COLUMN "avg_coach_rating" SET DATA TYPE DECIMAL(3,2),
ALTER COLUMN "coach_rating_total" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "avg_plan_rating" SET DATA TYPE DECIMAL(3,2),
ALTER COLUMN "plan_rating_total" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "diet_meal_items" ALTER COLUMN "quantity_grams" SET DATA TYPE DECIMAL(6,2);

-- AlterTable
ALTER TABLE "foods" ALTER COLUMN "calories_per_100g" SET DATA TYPE DECIMAL(6,2),
ALTER COLUMN "protein_per_100g" SET DATA TYPE DECIMAL(6,2),
ALTER COLUMN "carbs_per_100g" SET DATA TYPE DECIMAL(6,2),
ALTER COLUMN "fat_per_100g" SET DATA TYPE DECIMAL(6,2);

-- AlterTable
ALTER TABLE "workout_plans" DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "coaches_status_is_accepting_clients_idx" ON "coaches"("status", "is_accepting_clients");

-- CreateIndex
CREATE INDEX "coaches_status_province_id_city_id_idx" ON "coaches"("status", "province_id", "city_id");

-- CreateIndex
CREATE INDEX "coaches_title_headline_idx" ON "coaches"("title", "headline");

-- CreateIndex
CREATE INDEX "diet_plans_is_published_avg_rating_idx" ON "diet_plans"("is_published", "avg_rating");
