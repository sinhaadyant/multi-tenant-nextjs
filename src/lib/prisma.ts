import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  // Performance optimizations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling for better performance
  __internal: {
    engine: {
      connectionLimit: 20,
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 