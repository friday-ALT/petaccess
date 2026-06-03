import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

export const clinicsRouter = Router();

clinicsRouter.get("/", asyncHandler(async (_req, res) => {
  const clinics = await prisma.clinic.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, appointments: true } }
    }
  });
  res.json({ clinics });
}));

clinicsRouter.get("/:id", asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const clinic = await prisma.clinic.findFirst({
    where: { id, status: "ACTIVE" },
    include: { _count: { select: { members: true } } }
  });
  if (!clinic) {
    res.status(404).json({ error: "Clinic not found." });
    return;
  }
  res.json({ clinic });
}));

const applyClinicSchema = z.object({
  name: z.string().min(2),
  addressLine1: z.string().min(2),
  city: z.string().min(2),
  postcode: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  services: z.string().optional(),
  emergency24h: z.boolean().optional()
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

clinicsRouter.post("/apply", requireAuth, requireRole("VET", "ADMIN"), asyncHandler(async (req, res) => {
  const parsed = applyClinicSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const existingMember = await prisma.clinicMember.findUnique({ where: { userId: req.user!.id } });
  if (existingMember) {
    res.status(409).json({ error: "You are already linked to a clinic." });
    return;
  }

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.clinic.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const clinic = await prisma.clinic.create({
    data: {
      ...parsed.data,
      slug,
      status: "PENDING",
      services: parsed.data.services ?? ""
    }
  });

  await prisma.clinicMember.create({
    data: {
      clinicId: clinic.id,
      userId: req.user!.id,
      role: "ADMIN"
    }
  });

  res.status(201).json({ clinic, message: "Clinic application submitted. We will review and activate your practice." });
}));

clinicsRouter.patch("/:id/activate", requireAuth, requireRole("ADMIN"), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const clinic = await prisma.clinic.update({
    where: { id },
    data: { status: "ACTIVE" }
  });
  res.json({ clinic });
}));
