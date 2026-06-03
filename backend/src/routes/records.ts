import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const recordsRouter = Router();
recordsRouter.use(requireAuth);

recordsRouter.get("/", asyncHandler(async (req, res) => {
  const ownerId = req.user!.id;
  const records = await prisma.medicalRecord.findMany({
    where: { pet: { ownerId } },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      clinic: { select: { id: true, name: true } },
      vet: { select: { id: true, firstName: true, lastName: true } }
    },
    orderBy: { recordedAt: "desc" }
  });
  res.json({ records });
}));

const createRecordSchema = z.object({
  petId: z.string().min(1),
  recordType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional()
});

recordsRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const pet = await prisma.pet.findFirst({
    where: { id: parsed.data.petId, ownerId: req.user!.id }
  });
  if (!pet) {
    res.status(404).json({ error: "Pet not found." });
    return;
  }

  const record = await prisma.medicalRecord.create({
    data: {
      petId: parsed.data.petId,
      recordType: parsed.data.recordType,
      title: parsed.data.title,
      description: parsed.data.description
    }
  });

  res.status(201).json({ record });
}));
