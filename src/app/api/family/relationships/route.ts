import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// GET - Get family relationships for current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { sql } = await import("@/lib/db");

    // Get relationships where user is either parent or child
    const relationships = await sql`
      SELECT 
        fr.*,
        parent_user.email as parent_email,
        parent_user.age_range_min as parent_age_min,
        parent_user.age_range_max as parent_age_max,
        child_user.email as child_email,
        child_user.age_range_min as child_age_min,
        child_user.age_range_max as child_age_max
      FROM family_relationships fr
      JOIN users parent_user ON fr.parent_user_id = parent_user.id
      JOIN users child_user ON fr.child_user_id = child_user.id
      WHERE fr.parent_user_id = ${currentUser.id} OR fr.child_user_id = ${currentUser.id}
      ORDER BY fr.created_at DESC
    `;

    const formattedRelationships = relationships.map((rel) => ({
      id: rel.id,
      relationshipType: rel.relationship_type,
      childConsentGiven: rel.child_consent_given,
      createdAt: rel.created_at,
      isParent: rel.parent_user_id === currentUser.id,
      isChild: rel.child_user_id === currentUser.id,
      parent: {
        id: rel.parent_user_id,
        email: rel.parent_email,
        ageRangeMin: rel.parent_age_min,
        ageRangeMax: rel.parent_age_max,
      },
      child: {
        id: rel.child_user_id,
        email: rel.child_email,
        ageRangeMin: rel.child_age_min,
        ageRangeMax: rel.child_age_max,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedRelationships,
    });
  } catch (error) {
    console.error("Get family relationships error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
