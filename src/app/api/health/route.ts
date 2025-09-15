import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/init-db";
import { testConnection } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Check database health (tables exist, etc.)
    const dbHealthy = await checkDatabaseHealth();

    if (!dbHealthy) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database health check failed - missing tables or schema issues",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "All systems operational",
      timestamp: new Date().toISOString(),
      services: {
        database: "healthy",
        kv: "configured",
        blob: "configured",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during health check",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
