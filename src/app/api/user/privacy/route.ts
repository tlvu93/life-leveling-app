import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// Validation schema for privacy preferences
const privacyPreferencesSchema = z.object({
  allowPeerComparisons: z.boolean().default(true),
  allowFamilyViewing: z.boolean().default(false),
  shareGoalsWithFamily: z.boolean().default(false),
  shareProgressWithFamily: z.boolean().default(false),
  allowAnonymousDataCollection: z.boolean().default(true),
  dataRetentionConsent: z.boolean().default(true),
});

// GET - Get privacy preferences
export async function GET(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { sql } = await import("@/lib/db");

    // Get user's privacy preferences (stored as JSONB in a separate table or user table)
    // For now, we'll add a privacy_preferences column to users table
    const result = await sql`
      SELECT privacy_preferences FROM users WHERE id = ${currentUser.id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Return default preferences if none are set
    const preferences = result[0].privacy_preferences || {
      allowPeerComparisons: true,
      allowFamilyViewing: false,
      shareGoalsWithFamily: false,
      shareProgressWithFamily: false,
      allowAnonymousDataCollection: true,
      dataRetentionConsent: true,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Get privacy preferences error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update privacy preferences
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = privacyPreferencesSchema.parse(body);

    const { sql } = await import("@/lib/db");

    // Update privacy preferences
    const result = await sql`
      UPDATE users 
      SET privacy_preferences = ${JSON.stringify(
        validatedData
      )}, last_active = NOW()
      WHERE id = ${currentUser.id}
      RETURNING privacy_preferences
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Privacy preferences updated successfully",
      data: result[0].privacy_preferences,
    });
  } catch (error) {
    console.error("Update privacy preferences error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
