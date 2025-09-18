import { NextRequest, NextResponse } from "next/server";
import {
  getUserComparison,
  hasUserOptedIntoComparisons,
} from "@/lib/cohort-operations";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { category } = params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Interest category is required",
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

    // Get comparison for specific interest category
    const comparison = await getUserComparison(
      userId,
      decodeURIComponent(category)
    );

    if (!comparison) {
      return NextResponse.json(
        {
          success: false,
          error: "No comparison data available for this interest",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: comparison,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching interest comparison:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch comparison",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
