import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? false : undefined
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === "null") {
        callback(null, true);
        return;
      }

      const allowed = new Set([
        env.publicOrigin,
        env.FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
      ].filter(Boolean) as string[]);

      if (env.RAILWAY_PUBLIC_DOMAIN) {
        allowed.add(`https://${env.RAILWAY_PUBLIC_DOMAIN}`);
      }

      if (allowed.has(origin) || origin.endsWith(".railway.app")) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pet-access-backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiRouter);

if (env.NODE_ENV === "production") {
  app.use(express.static(publicDir));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicDir, "index-v2.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      service: "pet-access-backend",
      docs: "Use /api/health for healthcheck and /api/* endpoints.",
      frontend: "Open index-v2.html locally or deploy to Railway for the live site."
    });
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected server error.";
  res.status(500).json({ error: message });
});
