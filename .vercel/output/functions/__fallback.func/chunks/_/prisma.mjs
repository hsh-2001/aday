import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured.");
  }
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || ""
  });
  return new PrismaClient({ adapter });
};
const prisma = globalForPrisma.__adayPrisma || createPrismaClient();

export { prisma as p };
//# sourceMappingURL=prisma.mjs.map
