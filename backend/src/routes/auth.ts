import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["OWNER", "VET", "ADMIN"]).optional().default("OWNER")
});

authRouter.post("/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
    return;
  }

  const { email, password, firstName, lastName, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, role },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload." });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  });
}));
