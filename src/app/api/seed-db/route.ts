import { NextResponse } from "next/server";
import {
  seedDatabase,
  clearSeedData,
  generateCohortStats,
} from "@/lib/seed-data";

export async function POST(request: Request) {
  try {
    // Only allow in development environment for security
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: "Database seeding not allowed in production",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action = "seed" } = body;

    let result;
    let message;

    switch (action) {
      case "seed":
        result = await seedDatabase();
        message =
          "Database seeded successfully with predefined paths and sample cohort data";
        break;

      case "clear":
        result = await clearSeedData();
        message = "Seed data cleared successfully";
        break;

      case "generate-cohorts":
        result = await generateCohortStats();
        message = "Cohort statistics generated successfully";
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use 'seed', 'clear', or 'generate-cohorts'",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database seeding operation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform seeding operation",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Seed API is available",
    actions: [
      {
        action: "seed",
        description:
          "Populate database with predefined paths and sample cohort data",
        method: "POST",
        body: { action: "seed" },
      },
      {
        action: "clear",
        description: "Clear all seed data from database",
        method: "POST",
        body: { action: "clear" },
      },
      {
        action: "generate-cohorts",
        description: "Generate realistic cohort statistics",
        method: "POST",
        body: { action: "generate-cohorts" },
      },
    ],
    timestamp: new Date().toISOString(),
  });
}
