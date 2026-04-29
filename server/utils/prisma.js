import { getServerEnvValue } from "./env.js";

const globalForPrisma = globalThis;

const createPrismaClient = async () => {
  const databaseUrl = getServerEnvValue("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [{ PrismaClient }, { PrismaNeon }, { neonConfig }] = await Promise.all([
    import("@prisma/client"),
    import("@prisma/adapter-neon"),
    import("@neondatabase/serverless"),
  ]);

  if (typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
};

export const getPrisma = async () => {
  if (!globalForPrisma.__adayPrisma) {
    globalForPrisma.__adayPrisma = await createPrismaClient();
  }

  return globalForPrisma.__adayPrisma;
};
