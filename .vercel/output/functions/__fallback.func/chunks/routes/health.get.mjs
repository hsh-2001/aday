import { d as defineEventHandler } from '../nitro/nitro.mjs';
import { g as getPrisma } from '../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const health_get = defineEventHandler(async () => {
  try {
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      database: "connected",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      nodeEnv: "production"
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      ok: false,
      database: "failed",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      message: error instanceof Error ? error.message : "Database check failed.",
      nodeEnv: "production"
    };
  }
});

export { health_get as default };
//# sourceMappingURL=health.get.mjs.map
