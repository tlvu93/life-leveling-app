import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/init-db";

export async function POST() {
  try {
    // Only allow in development environment for security
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: "Database initialization not allowed in production",
        },
        { status: 403 }
      );
    }

    await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database initialization failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
