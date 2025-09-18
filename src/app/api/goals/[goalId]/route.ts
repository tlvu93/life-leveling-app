import { NextRequest, NextResponse } from "next/server";
import { updateGoalStatus } from "@/lib/database-operations";
import { isGoalStatus } from "@/lib/validation";
import { getTokenUserId } from "@/lib/auth";
import { GoalStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const userId = await getTokenUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { goalId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate the status
    if (!isGoalStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid status. Must be one of: active, completed, paused, cancelled",
        },
        { status: 400 }
      );
    }

    // Update the goal status
    const updatedGoal = await updateGoalStatus(goalId, status as GoalStatus);

    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: "Goal status updated successfully",
    });
  } catch (error) {
    console.error("Error updating goal status:", error);

    if (error instanceof Error && error.message === "Goal not found") {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update goal status" },
      { status: 500 }
    );
  }
}
