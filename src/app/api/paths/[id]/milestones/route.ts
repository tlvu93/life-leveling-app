import { NextRequest, NextResponse } from "next/server";
import { getPathMilestones } from "@/lib/path-management";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pathId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!pathId) {
      const response: ApiResponse = {
        success: false,
        error: "Path ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const milestones = await getPathMilestones(userId, pathId);

    const response: ApiResponse = {
      success: true,
      data: milestones,
      message: "Path milestones retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in path milestones API:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve path milestones",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
