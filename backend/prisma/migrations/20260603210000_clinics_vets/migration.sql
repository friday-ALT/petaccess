-- CreateEnum
CREATE TYPE "ClinicStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ClinicMemberRole" AS ENUM ('ADMIN', 'VET');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "services" TEXT NOT NULL DEFAULT '',
    "emergency24h" BOOLEAN NOT NULL DEFAULT false,
    "status" "ClinicStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMember" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClinicMemberRole" NOT NULL DEFAULT 'VET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "clinicId" TEXT;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN "clinicId" TEXT,
ADD COLUMN "vetId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMember_userId_key" ON "ClinicMember"("userId");

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
