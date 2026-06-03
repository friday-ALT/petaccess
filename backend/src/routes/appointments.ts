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
    include: { pet: true },
    orderBy: { startsAt: "asc" }
  });
  res.json({ appointments });
}));

const createAppointmentSchema = z.object({
  petId: z.string().min(1),
  clinicName: z.string().min(1),
  vetName: z.string().optional(),
  startsAt: z.string().datetime(),
  reason: z.string().optional()
});

appointmentsRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = createAppointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const ownerId = req.user!.id;
  const { petId, clinicName, vetName, startsAt, reason } = parsed.data;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId } });
  if (!pet) {
    res.status(404).json({ error: "Pet not found." });
    return;
  }

  const appointment = await prisma.appointment.create({
    data: {
      ownerId,
      petId,
      clinicName,
      vetName,
      startsAt: new Date(startsAt),
      reason,
      status: "PENDING"
    }
  });

  res.status(201).json({ appointment });
}));
