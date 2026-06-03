import { Router } from "express";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { getClinicForVetUser } from "../lib/vet-clinic.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

export const vetRouter = Router();
vetRouter.use(requireAuth, requireRole("VET", "ADMIN"));

async function requireVetClinic(userId: string) {
  const membership = await getClinicForVetUser(userId);
  if (!membership) {
    return null;
  }
  return membership;
}

vetRouter.get("/me", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  });

  res.json({ user, clinic: membership.clinic, membershipRole: membership.role });
}));

vetRouter.get("/appointments", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const appointments = await prisma.appointment.findMany({
    where: { clinicId: membership.clinicId },
    include: {
      pet: true,
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      clinic: true
    },
    orderBy: { startsAt: "asc" }
  });

  res.json({ appointments });
}));

const updateAppointmentSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  vetName: z.string().optional()
});

vetRouter.patch("/appointments/:id", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const parsed = updateAppointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const appointmentId = String(req.params.id);
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: membership.clinicId }
  });
  if (!existing) {
    res.status(404).json({ error: "Appointment not found." });
    return;
  }

  const vet = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      vetName: parsed.data.vetName ?? (vet ? `Dr. ${vet.lastName}` : undefined)
    },
    include: { pet: true, owner: { select: { id: true, firstName: true, lastName: true, email: true } } }
  });

  res.json({ appointment });
}));

vetRouter.get("/patients", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const appointments = await prisma.appointment.findMany({
    where: { clinicId: membership.clinicId },
    include: {
      pet: true,
      owner: { select: { id: true, firstName: true, lastName: true, email: true } }
    },
    orderBy: { startsAt: "desc" }
  });

  const byPet = new Map<string, {
    pet: typeof appointments[0]["pet"];
    owner: typeof appointments[0]["owner"];
    lastVisit: Date;
    lastStatus: AppointmentStatus;
  }>();

  for (const appt of appointments) {
    const current = byPet.get(appt.petId);
    if (!current || appt.startsAt > current.lastVisit) {
      byPet.set(appt.petId, {
        pet: appt.pet,
        owner: appt.owner,
        lastVisit: appt.startsAt,
        lastStatus: appt.status
      });
    }
  }

  res.json({ patients: Array.from(byPet.values()) });
}));

const createRecordSchema = z.object({
  petId: z.string().min(1),
  recordType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  recordedAt: z.string().datetime().optional()
});

vetRouter.post("/records", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const hasAppointment = await prisma.appointment.findFirst({
    where: { petId: parsed.data.petId, clinicId: membership.clinicId }
  });
  if (!hasAppointment) {
    res.status(403).json({ error: "This pet has no appointments at your clinic." });
    return;
  }

  const record = await prisma.medicalRecord.create({
    data: {
      petId: parsed.data.petId,
      clinicId: membership.clinicId,
      vetId: req.user!.id,
      recordType: parsed.data.recordType,
      title: parsed.data.title,
      description: parsed.data.description,
      recordedAt: parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : undefined
    }
  });

  res.status(201).json({ record });
}));

vetRouter.get("/stats", asyncHandler(async (req, res) => {
  const membership = await requireVetClinic(req.user!.id);
  if (!membership) {
    res.status(404).json({ error: "No clinic linked to this vet account." });
    return;
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayCount, pendingCount, patientCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        clinicId: membership.clinicId,
        startsAt: { gte: startOfDay, lte: endOfDay }
      }
    }),
    prisma.appointment.count({
      where: { clinicId: membership.clinicId, status: "PENDING" }
    }),
    prisma.appointment.groupBy({
      by: ["petId"],
      where: { clinicId: membership.clinicId }
    }).then((rows) => rows.length)
  ]);

  res.json({
    stats: {
      todayAppointments: todayCount,
      pendingAppointments: pendingCount,
      activePatients: patientCount
    }
  });
}));
