import { getPrisma } from "../utils/prisma.js";

export default defineEventHandler(async () => {
  try {
    const prisma = getPrisma();

    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      database: "connected",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      nodeEnv: process.env.NODE_ENV,
    };
  } catch (error) {
    console.error("Health check failed:", error);

    return {
      ok: false,
      database: "failed",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      message: error instanceof Error ? error.message : "Database check failed.",
      nodeEnv: process.env.NODE_ENV,
    };
  }
});
