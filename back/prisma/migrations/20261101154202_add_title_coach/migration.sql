/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `coaches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `coaches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "coaches_title_key" ON "coaches"("title");
