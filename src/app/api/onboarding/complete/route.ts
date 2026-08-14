import { NextRequest, NextResponse } from "next/server";
import { validateOnboardingData } from "@/lib/validation";
import {
  createUserInterest,
  completeOnboarding,
  getUserById,
} from "@/lib/database-operations";
import { AuthService, AUTH_COOKIE_NAME, type AuthUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await AuthService.getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Parse request body
    const body = await request.json();
    const { interests } = body;

    // Validate onboarding data
    const validation = validateOnboardingData({ interests });
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          message: validation.errors.join("; "),
        },
        { status: 400 }
      );
    }

    // Create user interests in database
    const createdInterests = [];
    for (const interest of interests) {
      try {
        const createdInterest = await createUserInterest({
          userId,
          category: interest.category,
          subcategory: interest.subcategory,
          currentLevel: interest.level,
          intentLevel: interest.intent,
        });
        createdInterests.push(createdInterest);
      } catch (error) {
        console.error(`Error creating interest ${interest.category}:`, error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to save interests",
            message: `Could not save interest: ${interest.category}`,
          },
          { status: 500 }
        );
      }
    }

    // Mark onboarding as completed
    try {
      console.log("Marking onboarding as completed for user:", userId);
      await completeOnboarding(userId);
      console.log("✅ Onboarding completed successfully");

      // Update JWT token with new onboarding status
      const updatedUser = await getUserById(userId);
      if (updatedUser) {
        // Map database user to AuthUser format. `AuthUser.createdAt` is a
        // string because it round-trips through the JWT as JSON.
        const authUser: AuthUser = {
          id: updatedUser.id,
          ageRangeMin: updatedUser.ageRangeMin,
          ageRangeMax: updatedUser.ageRangeMax,
          familyModeEnabled: updatedUser.familyModeEnabled,
          onboardingCompleted: updatedUser.onboardingCompleted,
          createdAt: updatedUser.createdAt.toISOString(),
        };

        const newToken = AuthService.generateToken({
          userId: authUser.id,
          sessionId: "onboarding-complete",
          user: authUser,
        });

        // Set the updated token in the response
        const response = NextResponse.json({
          success: true,
          data: {
            interests: createdInterests,
            onboardingCompleted: true,
          },
          message: "Onboarding completed successfully",
        });

        response.cookies.set(AUTH_COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to complete onboarding",
          message: "Interests saved but could not mark onboarding as complete",
        },
        { status: 500 }
      );
    }

    // Fallback response if token update failed
    const response: ApiResponse = {
      success: true,
      data: {
        interests: createdInterests,
        onboardingCompleted: true,
      },
      message: "Onboarding completed successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in onboarding completion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred during onboarding",
      },
      { status: 500 }
    );
  }
}
