import { NextRequest, NextResponse } from "next/server";
import { createGoal, getUserGoals } from "@/lib/database-operations";
import { validateGoal } from "@/lib/validation";
import { getTokenUserId } from "@/lib/auth";
import { GoalType, Timeframe, SkillLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const userId = await getTokenUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      interestCategory,
      goalType,
      title,
      description,
      targetLevel,
      timeframe,
      targetDate,
    } = body;

    // Validate the goal data
    const validation = validateGoal({
      interestCategory,
      goalType,
      title,
      description,
      targetLevel,
      timeframe,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create the goal
    const goal = await createGoal({
      userId,
      interestCategory,
      goalType: goalType as GoalType,
      title,
      description,
      targetLevel: targetLevel as SkillLevel,
      timeframe: timeframe as Timeframe,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: goal,
      message: "Goal created successfully",
    });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getTokenUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const goals = await getUserGoals(
      userId,
      status as any // Will be validated in the database operation
    );

    return NextResponse.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}
