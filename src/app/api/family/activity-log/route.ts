import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// GET - Get family activity log for transparency
export async function GET(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get("relationshipId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!relationshipId) {
      return NextResponse.json(
        { success: false, error: "Relationship ID is required" },
        { status: 400 }
      );
    }

    const { sql } = await import("@/lib/db");

    // Verify user has access to this relationship
    const relationshipResult = await sql`
      SELECT * FROM family_relationships 
      WHERE id = ${relationshipId} 
        AND (parent_user_id = ${currentUser.id} OR child_user_id = ${currentUser.id})
        AND child_consent_given = true
    `;

    if (relationshipResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Family relationship not found or unauthorized",
        },
        { status: 403 }
      );
    }

    // Get activity log entries
    const activityResult = await sql`
      SELECT fal.*, u.email as performed_by_email
      FROM family_activity_log fal
      JOIN users u ON fal.performed_by_user_id = u.id
      WHERE fal.relationship_id = ${relationshipId}
      ORDER BY fal.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM family_activity_log
      WHERE relationship_id = ${relationshipId}
    `;

    const totalCount = parseInt(countResult[0].total);

    return NextResponse.json({
      success: true,
      data: {
        activities: activityResult.map((activity) => ({
          id: activity.id,
          actionType: activity.action_type,
          performedBy: activity.performed_by_email,
          details: activity.details,
          createdAt: activity.created_at,
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Family activity log error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
