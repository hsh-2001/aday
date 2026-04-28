const globalForPrisma = globalThis;

const createPrismaClient = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("@prisma/client"),
    import("@prisma/adapter-pg"),
  ]);

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
};

export const getPrisma = async () => {
  if (!globalForPrisma.__adayPrisma) {
    globalForPrisma.__adayPrisma = await createPrismaClient();
  }

  return globalForPrisma.__adayPrisma;
};
