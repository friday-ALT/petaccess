import { prisma } from "../db.js";

export async function getClinicForVetUser(userId: string) {
  return prisma.clinicMember.findUnique({
    where: { userId },
    include: { clinic: true }
  });
}
