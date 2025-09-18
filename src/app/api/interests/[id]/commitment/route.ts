import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CommitmentLevel } from "@/types";
import { ApiResponse } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { commitmentLevel } = await request.json();
    const { id: interestId } = params;

    if (!interestId) {
      return NextResponse.json(
        {
          success: false,
          error: "Interest ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (
      !commitmentLevel ||
      !Object.values(CommitmentLevel).includes(commitmentLevel)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid commitment level is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get current interest data for cohort updates
    const currentResult = await sql`
      SELECT ui.category, ui.intent_level, u.age_range_min, u.age_range_max
      FROM user_interests ui
      JOIN users u ON ui.user_id = u.id
      WHERE ui.id = ${interestId}
    `;

    if (currentResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Interest not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const currentData = currentResult[0];
    const oldCommitmentLevel = currentData.intent_level as CommitmentLevel;

    // Update the commitment level
    const result = await sql`
      UPDATE user_interests 
      SET intent_level = ${commitmentLevel}, updated_at = NOW()
      WHERE id = ${interestId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update commitment level",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Trigger cohort stats update in background for both old and new commitment levels
    if (oldCommitmentLevel !== commitmentLevel) {
      import("@/lib/cohort-operations").then(
        ({ getUserAgeRange, updateCohortStatistics }) => {
          const ageRange = getUserAgeRange(
            currentData.age_range_min,
            currentData.age_range_max
          );

          // Update stats for old commitment level
          updateCohortStatistics(
            ageRange,
            currentData.category,
            oldCommitmentLevel
          ).catch((error) => {
            console.error(
              "Background cohort stats update failed for old level:",
              error
            );
          });

          // Update stats for new commitment level
          updateCohortStatistics(
            ageRange,
            currentData.category,
            commitmentLevel
          ).catch((error) => {
            console.error(
              "Background cohort stats update failed for new level:",
              error
            );
          });
        }
      );
    }

    const updatedInterest = result[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedInterest.id,
          userId: updatedInterest.user_id,
          category: updatedInterest.category,
          subcategory: updatedInterest.subcategory,
          currentLevel: updatedInterest.current_level,
          intentLevel: updatedInterest.intent_level,
          createdAt: updatedInterest.created_at,
          updatedAt: updatedInterest.updated_at,
        },
        message: "Commitment level updated successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating commitment level:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update commitment level",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
