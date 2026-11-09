/*
  Warnings:

  - You are about to drop the column `required_equipment` on the `workout_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workout_plans" DROP COLUMN "required_equipment";

-- CreateTable
CREATE TABLE "_WorkoutPlanEquipment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkoutPlanEquipment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WorkoutPlanEquipment_B_index" ON "_WorkoutPlanEquipment"("B");

-- AddForeignKey
ALTER TABLE "_WorkoutPlanEquipment" ADD CONSTRAINT "_WorkoutPlanEquipment_A_fkey" FOREIGN KEY ("A") REFERENCES "equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkoutPlanEquipment" ADD CONSTRAINT "_WorkoutPlanEquipment_B_fkey" FOREIGN KEY ("B") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
