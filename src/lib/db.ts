import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the database connection
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

// Helper function to execute queries with error handling
export async function executeQuery<T>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await sql(query, ...params);
    return result as T[];
  } catch (error) {
    console.error("Query execution failed:", error);
    throw error;
  }
}
