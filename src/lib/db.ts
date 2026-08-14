import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/**
 * Neon's HTTP driver. Use it as a tagged template (`sql\`SELECT ...\``) so
 * interpolated values are parameterised; use `sql.query(text, params)` when the
 * statement itself has to be built at runtime.
 */
export const sql = neon(process.env.DATABASE_URL);

// Database connection test function
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection successful:", result);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
