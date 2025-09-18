import { NextRequest, NextResponse } from "next/server";
import {
  getAllUserComparisons,
  hasUserOptedIntoComparisons,
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

    // Check if user has opted into comparisons
    const hasOptedIn = await hasUserOptedIntoComparisons(userId);
    if (!hasOptedIn) {
      return NextResponse.json(
        {
          success: false,
          error: "User has not opted into peer comparisons",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Get all comparisons for the user
    const comparisons = await getAllUserComparisons(userId);

    return NextResponse.json(
      {
        success: true,
        data: comparisons,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user comparisons:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch comparisons",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
