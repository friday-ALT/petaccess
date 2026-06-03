import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export async function ensureSeedData(): Promise<void> {
  const clinicCount = await prisma.clinic.count();
  if (clinicCount > 0) return;

  const clinics = [
    {
      name: "Sevenoaks Vets",
      slug: "sevenoaks-vets",
      addressLine1: "London Road",
      city: "Sevenoaks",
      postcode: "TN13",
      phone: "01732 450500",
      email: "hello@sevenoaksvets.co.uk",
      services: "Dogs,Cats,Rabbits,24hr Emergency",
      emergency24h: true,
      status: "ACTIVE" as const
    },
    {
      name: "Tonbridge Animal Clinic",
      slug: "tonbridge-animal-clinic",
      addressLine1: "High Street",
      city: "Tonbridge",
      postcode: "TN9",
      phone: "01732 770200",
      email: "info@tonbridgeanimal.co.uk",
      services: "All Species,Exotic,Specialist",
      emergency24h: false,
      status: "ACTIVE" as const
    },
    {
      name: "Maidstone Pet Care Centre",
      slug: "maidstone-pet-care",
      addressLine1: "King Street",
      city: "Maidstone",
      postcode: "ME14",
      phone: "01622 123456",
      email: "care@maidstonepet.co.uk",
      services: "Dogs,Cats,Exotic",
      emergency24h: false,
      status: "ACTIVE" as const
    }
  ];

  for (const clinic of clinics) {
    await prisma.clinic.create({ data: clinic });
  }

  const sevenoaks = await prisma.clinic.findUnique({ where: { slug: "sevenoaks-vets" } });
  if (!sevenoaks) return;

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const vet = await prisma.user.upsert({
    where: { email: "dr.walsh@sevenoaksvets.co.uk" },
    update: { firstName: "Helen", lastName: "Walsh", role: "VET", passwordHash },
    create: {
      email: "dr.walsh@sevenoaksvets.co.uk",
      firstName: "Helen",
      lastName: "Walsh",
      role: "VET",
      passwordHash
    }
  });

  await prisma.clinicMember.upsert({
    where: { userId: vet.id },
    update: { clinicId: sevenoaks.id, role: "ADMIN" },
    create: { clinicId: sevenoaks.id, userId: vet.id, role: "ADMIN" }
  });

  console.log("Auto-seed: 3 clinics + demo vet dr.walsh@sevenoaksvets.co.uk");
}
