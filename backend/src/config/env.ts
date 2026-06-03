import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  FRONTEND_ORIGIN: z.string().url().optional(),
  /** Set automatically on Railway (e.g. pet-access-production.up.railway.app) */
  RAILWAY_PUBLIC_DOMAIN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  publicOrigin: data.FRONTEND_ORIGIN
    ?? (data.RAILWAY_PUBLIC_DOMAIN ? `https://${data.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:5500")
};
