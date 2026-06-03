import { Router } from "express";
import { appointmentsRouter } from "./appointments.js";
import { authRouter } from "./auth.js";
import { clinicsRouter } from "./clinics.js";
import { healthRouter } from "./health.js";
import { petsRouter } from "./pets.js";
import { recordsRouter } from "./records.js";
import { vetRouter } from "./vet.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/clinics", clinicsRouter);
apiRouter.use("/pets", petsRouter);
apiRouter.use("/appointments", appointmentsRouter);
apiRouter.use("/records", recordsRouter);
apiRouter.use("/vet", vetRouter);
