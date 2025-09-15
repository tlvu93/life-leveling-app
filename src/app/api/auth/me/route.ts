import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserById } from "@/lib/database-operations";

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get full user profile
    const userProfile = await getUserById(currentUser.id);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

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
    console.error("Get current user error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
