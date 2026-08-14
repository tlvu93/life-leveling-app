import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 requires an explicit driver adapter — the Rust query engine is gone.
 * `@prisma/adapter-pg` speaks plain Postgres, which covers Neon's pooled
 * connection string as well.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local before using the database."
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    // Query logging is noisy and leaks parameter values; keep it to warnings
    // and errors outside of explicit debugging.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Next.js dev-mode hot reload re-evaluates modules, which would otherwise open a
// new connection pool on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
