import { NextRequest, NextResponse } from "next/server";
import { updateAllCohortStatistics } from "@/lib/cohort-operations";
import { ApiResponse } from "@/types";

export async function POST(_request: NextRequest) {
  try {
    // In a real application, you would add authentication/authorization here
    // For now, we'll allow this endpoint to be called for maintenance

    await updateAllCohortStatistics();

    return NextResponse.json(
      {
        success: true,
        message: "Cohort statistics updated successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cohort statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update cohort statistics",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
