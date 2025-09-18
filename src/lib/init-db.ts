import { sql } from "./db";
import { readFileSync } from "fs";
import { join } from "path";

export async function initializeDatabase() {
  try {
    console.log("Initializing database schema...");

    // First, ensure UUID extension is enabled
    console.log("Enabling UUID extension...");
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log("✅ UUID extension enabled");

    // Read the schema file - try minimal schema first
    let schemaPath = join(process.cwd(), "minimal-schema.sql");

    // Fallback to full schema if minimal doesn't exist
    try {
      readFileSync(schemaPath, "utf8");
    } catch {
      schemaPath = join(process.cwd(), "src", "lib", "schema.sql");
    }

    const schema = readFileSync(schemaPath, "utf8");
    console.log(`Using schema file: ${schemaPath}`);

    // Split the schema into individual statements more carefully
    // First, remove comments and normalize whitespace
    const cleanedSchema = schema
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n");

    const statements = cleanedSchema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement with detailed logging
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `Executing statement ${i + 1}/${statements.length}:`,
            statement.substring(0, 50) + "..."
          );
          await sql.unsafe(statement);
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`✗ Statement ${i + 1} failed:`, error);
          console.error("Failed statement:", statement);
          throw error;
        }
      }
    }

    // Ensure UUID defaults are set correctly (in case schema didn't apply them)
    console.log("Ensuring UUID defaults are set...");
    try {
      const tables = [
        "users",
        "user_interests",
        "goals",
        "retrospectives",
        "skill_history",
        "cohort_stats",
        "family_relationships",
        "family_activity_log",
        "family_safety_alerts",
        "family_safety_settings",
      ];

      for (const table of tables) {
        await sql.unsafe(
          `ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT uuid_generate_v4()`
        );
      }
      console.log("✅ UUID defaults verified/set for all tables");
    } catch (error) {
      console.log(
        "Note: Some UUID defaults may already be set:",
        error.message
      );
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
