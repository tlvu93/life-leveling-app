import { NextRequest, NextResponse } from "next/server";
import {
  startUserPath,
  getUserPathsWithProgress,
  getUserPathProgress,
} from "@/lib/database-operations";
import { completePathStage } from "@/lib/path-management";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const pathId = searchParams.get("pathId");

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (pathId) {
      // Get progress for specific path
      const progress = await getUserPathProgress(userId, pathId);

      const response: ApiResponse = {
        success: true,
        data: progress[0] || null,
        message: "User path progress retrieved successfully",
      };

      return NextResponse.json(response);
    }

    // Get all paths with progress for user
    const pathsWithProgress = await getUserPathsWithProgress(userId);

    const response: ApiResponse = {
      success: true,
      data: pathsWithProgress,
      message: "User paths with progress retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in user path progress API:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve user path progress",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pathId, action, stageNumber } = body;

    if (!userId || !pathId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID and Path ID are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (action === "start") {
      // Start a new path for user
      const progress = await startUserPath(userId, pathId);

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: "Path started successfully",
      };

      return NextResponse.json(response);
    }

    if (action === "complete_stage") {
      if (typeof stageNumber !== "number") {
        const response: ApiResponse = {
          success: false,
          error: "Stage number is required for completing a stage",
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Complete a specific stage
      const progress = await completePathStage(userId, pathId, stageNumber);

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: "Stage completed successfully",
      };

      return NextResponse.json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Invalid action. Supported actions: 'start', 'complete_stage'",
    };

    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    console.error("Error in user path progress POST API:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update user path progress",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
