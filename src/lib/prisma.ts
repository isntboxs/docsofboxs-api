import { PrismaNeon } from '@prisma/adapter-neon';

import { env } from '@/configs/env';

import { PrismaClient } from '@/generated/prisma/client';

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
const createPrismaClient = () => new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
