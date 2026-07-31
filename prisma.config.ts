import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 no longer reads `.env` implicitly and no longer takes the datasource
 * URL from the schema's `env()` call at CLI time, so it is wired up here.
 * `dotenv/config` loads `.env`; Next.js separately loads `.env.local` at
 * runtime, which is where the real DATABASE_URL lives in local development.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
