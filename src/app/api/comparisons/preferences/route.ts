import { NextRequest, NextResponse } from "next/server";
import {
  updateUserComparisonPreference,
  hasUserOptedIntoComparisons,
  updateAllCohortStatistics,
} from "@/lib/cohort-operations";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const hasOptedIn = await hasUserOptedIntoComparisons(userId);

    return NextResponse.json(
      {
        success: true,
        data: { allowPeerComparisons: hasOptedIn },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching comparison preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch preferences",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, allowPeerComparisons } = await request.json();

    if (!userId || typeof allowPeerComparisons !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and allowPeerComparisons boolean are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    await updateUserComparisonPreference(userId, allowPeerComparisons);

    // If user opted in, trigger cohort stats update
    if (allowPeerComparisons) {
      // Run this in background to avoid blocking the response
      updateAllCohortStatistics().catch((error) => {
        console.error("Background cohort stats update failed:", error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Comparison preference updated successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating comparison preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update preferences",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
