import { Router } from "express";
import { appointmentsRouter } from "./appointments.js";
import { authRouter } from "./auth.js";
import { healthRouter } from "./health.js";
import { petsRouter } from "./pets.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/pets", petsRouter);
apiRouter.use("/appointments", appointmentsRouter);
