import { NextRequest, NextResponse } from "next/server";
import { getPathById } from "@/lib/database-operations";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pathId = params.id;

    if (!pathId) {
      const response: ApiResponse = {
        success: false,
        error: "Path ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const path = await getPathById(pathId);

    if (!path) {
      const response: ApiResponse = {
        success: false,
        error: "Path not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: path,
      message: "Path retrieved successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in path detail API:", error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve path",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
