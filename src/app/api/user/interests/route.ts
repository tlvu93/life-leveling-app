import { NextRequest, NextResponse } from "next/server";
import { getUserInterests } from "@/lib/database-operations";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const interests = await getUserInterests(userId);

    const response: ApiResponse = {
      success: true,
      data: interests,
      message: "User interests retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in user interests API:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve user interests",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
