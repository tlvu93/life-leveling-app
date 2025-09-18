import { NextRequest, NextResponse } from "next/server";
import { getPathsForUser, getPredefinedPaths } from "@/lib/database-operations";
import { getPathRecommendations } from "@/lib/path-management";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
    const recommendations = searchParams.get("recommendations") === "true";

    if (recommendations && userId) {
      // Get path recommendations for user
      const pathRecommendations = await getPathRecommendations(userId, 10);

      const response: ApiResponse = {
        success: true,
        data: pathRecommendations,
        message: "Path recommendations retrieved successfully",
      };

      return NextResponse.json(response);
    }

    if (userId) {
      // Get age-appropriate paths for specific user
      const paths = await getPathsForUser(userId, category || undefined);

      const response: ApiResponse = {
        success: true,
        data: paths,
        message: "User paths retrieved successfully",
      };

      return NextResponse.json(response);
    }

    // Get all predefined paths (optionally filtered by category)
    const paths = await getPredefinedPaths(category || undefined);

    const response: ApiResponse = {
      success: true,
      data: paths,
      message: "Predefined paths retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in paths API:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to retrieve paths",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
