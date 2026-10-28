/*
  Warnings:

  - The `experience_years` column on the `coaches` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "coaches" DROP COLUMN "experience_years",
ADD COLUMN     "experience_years" DATE;

-- AlterTable
ALTER TABLE "training_goal" ALTER COLUMN "logo" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
