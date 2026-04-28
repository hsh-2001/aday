import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });
  return new PrismaClient({ adapter });
};
const getPrisma = () => {
  if (!globalForPrisma.__adayPrisma) {
    globalForPrisma.__adayPrisma = createPrismaClient();
  }
  return globalForPrisma.__adayPrisma;
};

export { getPrisma as g };
//# sourceMappingURL=prisma.mjs.map
