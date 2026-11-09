/*
  Warnings:

  - You are about to drop the column `commission_rate` on the `plan_requests` table. All the data in the column will be lost.
  - Added the required column `type` to the `user_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserLogType" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "banner" TEXT;

-- AlterTable
ALTER TABLE "plan_requests" DROP COLUMN "commission_rate";

-- AlterTable
ALTER TABLE "user_logs" ADD COLUMN     "endtimeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startimetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "UserLogType" NOT NULL;
