import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  });

  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.__adayPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__adayPrisma = prisma;
}
