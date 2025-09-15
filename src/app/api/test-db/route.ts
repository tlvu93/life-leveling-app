import { NextResponse } from "next/server";
import { testDatabaseOperations } from "@/lib/test-db-operations";

export async function POST() {
  try {
    // Only allow in development environment for security
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: "Database testing not allowed in production",
        },
        { status: 403 }
      );
    }

    const testResults = await testDatabaseOperations();

    if (testResults.success) {
      return NextResponse.json({
        success: true,
        message: "All database operations tests passed successfully",
        testResults: testResults.testResults,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Database operations tests failed",
          details: testResults.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Database test execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute database tests",
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
    message: "Database test API is available",
    description:
      "POST to this endpoint to run comprehensive database operations tests",
    note: "Only available in development environment",
    timestamp: new Date().toISOString(),
  });
}
