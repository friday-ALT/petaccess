import { env } from "./config/env.js";
import { prisma } from "./db.js";
import { app } from "./app.js";

const host = env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const server = app.listen(env.PORT, host, () => {
  const url =
    env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${env.RAILWAY_PUBLIC_DOMAIN}`
      : `http://localhost:${env.PORT}`;
  console.log(`Pet Access running on ${url}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
