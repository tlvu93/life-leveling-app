import { sql } from "./db";
import { readFileSync } from "fs";
import { join } from "path";

export async function initializeDatabase() {
  try {
    console.log("Initializing database schema...");

    // Read the schema file
    const schemaPath = join(process.cwd(), "src", "lib", "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await sql(statement);
      }
    }

    console.log("Database schema initialized successfully!");
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export async function checkDatabaseHealth() {
  try {
    // Test basic connectivity
    await sql`SELECT 1 as health_check`;

    // Check if main tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_interests', 'goals', 'retrospectives')
    `;

    const expectedTables = [
      "users",
      "user_interests",
      "goals",
      "retrospectives",
    ];
    const existingTables = tables.map((t) => t.table_name);
    const missingTables = expectedTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.warn("Missing tables:", missingTables);
      return false;
    }

    console.log("Database health check passed!");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
