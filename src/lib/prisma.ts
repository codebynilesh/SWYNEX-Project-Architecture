import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  // When using engineType="client", an adapter is required.
  // We detect if the generated client expects an adapter by checking if
  // the DATABASE_URL is present (always) and creating a PrismaPg adapter.
  // This works for both real PostgreSQL and PGlite's wire-protocol server.
  try {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    return new PrismaClient({
      adapter,
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  } catch {
    // Fallback for library engine (no adapter) - e.g., when engineType is not "client"
    return new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
