import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";

type AuthedUser = {
  id: string;
  role: "OWNER" | "VET" | "ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
