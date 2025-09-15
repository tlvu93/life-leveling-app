import { NextRequest, NextResponse } from "next/server";
import { validateOnboardingData } from "@/lib/validation";
import {
  createUserInterest,
  completeOnboarding,
} from "@/lib/database-operations";
import { AuthService } from "@/lib/auth";
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
      await completeOnboarding(userId);
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
