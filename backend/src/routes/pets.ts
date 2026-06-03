import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const petsRouter = Router();
petsRouter.use(requireAuth);

petsRouter.get("/", asyncHandler(async (req, res) => {
  const ownerId = req.user!.id;
  const pets = await prisma.pet.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ pets });
}));

const createPetSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  sex: z.string().optional(),
  weightKg: z.number().optional(),
  microchipId: z.string().optional(),
  allergies: z.string().optional()
});

petsRouter.post("/", asyncHandler(async (req, res) => {
  const parsed = createPetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const ownerId = req.user!.id;
  const data = parsed.data;
  const pet = await prisma.pet.create({
    data: {
      ownerId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      sex: data.sex,
      weightKg: data.weightKg,
      microchipId: data.microchipId,
      allergies: data.allergies
    }
  });

  res.status(201).json({ pet });
}));
