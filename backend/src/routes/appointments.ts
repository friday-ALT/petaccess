import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth);

appointmentsRouter.get("/", asyncHandler(async (req, res) => {
  const ownerId = req.user!.id;
  const appointments = await prisma.appointment.findMany({
    where: { ownerId },
    include: { pet: true, clinic: true },
    orderBy: { startsAt: "asc" }
  });
  res.json({ appointments });
}));

const createAppointmentSchema = z.object({
  petId: z.string().min(1),
  clinicId: z.string().min(1).optional(),
  clinicName: z.string().min(1).optional(),
  vetName: z.string().optional(),
  startsAt: z.string().datetime(),
  reason: z.string().optional()
}).refine((data) => data.clinicId || data.clinicName, {
  message: "clinicId or clinicName is required."
});

appointmentsRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = createAppointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const ownerId = req.user!.id;
  const { petId, clinicId, vetName, startsAt, reason } = parsed.data;
  let clinicName = parsed.data.clinicName ?? "";
  let resolvedClinicId: string | undefined = clinicId;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId } });
  if (!pet) {
    res.status(404).json({ error: "Pet not found." });
    return;
  }

  if (clinicId) {
    const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, status: "ACTIVE" } });
    if (!clinic) {
      res.status(404).json({ error: "Clinic not found or not active." });
      return;
    }
    clinicName = clinic.name;
    resolvedClinicId = clinic.id;
  }

  const appointment = await prisma.appointment.create({
    data: {
      ownerId,
      petId,
      clinicId: resolvedClinicId,
      clinicName,
      vetName,
      startsAt: new Date(startsAt),
      reason,
      status: "PENDING"
    },
    include: { pet: true, clinic: true }
  });

  res.status(201).json({ appointment });
}));
