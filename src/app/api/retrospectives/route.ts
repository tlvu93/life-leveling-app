import { NextRequest, NextResponse } from "next/server";
import {
  createRetrospective,
  getUserRetrospectives,
} from "@/lib/database-operations";
import { validateRetrospective } from "@/lib/validation";
import { getTokenUserId } from "@/lib/auth";
import { RetrospectiveType } from "@/types";

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
    const { type, insights, skillUpdates, goalsReviewed } = body;

    // Validate the retrospective data
    const validation = validateRetrospective({
      type,
      insights,
      skillUpdates,
      goalsReviewed,
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

    // Create the retrospective
    const retrospective = await createRetrospective({
      userId,
      type: type as RetrospectiveType,
      insights,
      skillUpdates,
      goalsReviewed,
    });

    return NextResponse.json({
      success: true,
      data: retrospective,
      message: "Retrospective created successfully",
    });
  } catch (error) {
    console.error("Error creating retrospective:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create retrospective" },
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
    const type = searchParams.get("type");

    const retrospectives = await getUserRetrospectives(
      userId,
      type as RetrospectiveType
    );

    return NextResponse.json({
      success: true,
      data: retrospectives,
    });
  } catch (error) {
    console.error("Error fetching retrospectives:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch retrospectives" },
      { status: 500 }
    );
  }
}
