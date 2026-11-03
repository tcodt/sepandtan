-- AlterTable
ALTER TABLE "equipments" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "cover_img" TEXT;

-- CreateTable
CREATE TABLE "_EquipmentToProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipmentToProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EquipmentToProfile_B_index" ON "_EquipmentToProfile"("B");

-- AddForeignKey
ALTER TABLE "_EquipmentToProfile" ADD CONSTRAINT "_EquipmentToProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToProfile" ADD CONSTRAINT "_EquipmentToProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
