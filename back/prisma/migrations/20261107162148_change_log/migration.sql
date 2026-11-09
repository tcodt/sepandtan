/*
  Warnings:

  - You are about to drop the column `type` on the `user_logs` table. All the data in the column will be lost.
  - Added the required column `jalali_month` to the `user_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jalali_year` to the `user_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_logs" DROP COLUMN "type",
ADD COLUMN     "jalali_month" INTEGER NOT NULL,
ADD COLUMN     "jalali_year" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "UserLogType";

-- CreateIndex
CREATE INDEX "user_logs_user_id_jalali_year_jalali_month_idx" ON "user_logs"("user_id", "jalali_year", "jalali_month");
