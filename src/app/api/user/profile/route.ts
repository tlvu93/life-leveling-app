import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserById, updateUserLastActive } from "@/lib/database-operations";
import { z } from "zod";

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userProfile = await getUserById(currentUser.id);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update last active timestamp
    await updateUserLastActive(currentUser.id);

    return NextResponse.json({
      success: true,
      data: {
        userId: userProfile.id,
        email: userProfile.email,
        ageRangeMin: userProfile.ageRangeMin,
        ageRangeMax: userProfile.ageRangeMax,
        familyModeEnabled: userProfile.familyModeEnabled,
        onboardingCompleted: userProfile.onboardingCompleted,
        interests: userProfile.interests,
        createdAt: userProfile.createdAt,
        lastActive: userProfile.lastActive,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
const updateProfileSchema = z.object({
  familyModeEnabled: z.boolean().optional(),
});

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
    const validatedData = updateProfileSchema.parse(body);

    const { sql } = await import("@/lib/db");

    // Update user profile
    if (validatedData.familyModeEnabled === undefined) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE users 
      SET family_mode_enabled = ${validatedData.familyModeEnabled}, last_active = NOW()
      WHERE id = ${currentUser.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = result[0];

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId: updatedUser.id,
        familyModeEnabled: updatedUser.family_mode_enabled,
        lastActive: updatedUser.last_active,
      },
    });
  } catch (error) {
    console.error("Update user profile error:", error);

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
