import { getPrisma } from "../utils/prisma.js";
import { getServerEnvValue, hasServerEnvValue } from "../utils/env.js";

export default defineEventHandler(async () => {
  try {
    const prisma = await getPrisma();

    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      database: "connected",
      hasDatabaseUrl: hasServerEnvValue("DATABASE_URL"),
      hasJwtSecret: hasServerEnvValue("JWT_SECRET"),
      nodeEnv: getServerEnvValue("NODE_ENV"),
    };
  } catch (error) {
    console.error("Health check failed:", error);

    return {
      ok: false,
      database: "failed",
      hasDatabaseUrl: hasServerEnvValue("DATABASE_URL"),
      hasJwtSecret: hasServerEnvValue("JWT_SECRET"),
      message: error instanceof Error ? error.message : "Database check failed.",
      nodeEnv: getServerEnvValue("NODE_ENV"),
    };
  }
});
