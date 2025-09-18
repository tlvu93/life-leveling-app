import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// GET - Get all family relationships for current user
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

    // Get relationships where current user is either parent or child
    const relationshipsResult = await sql`
      SELECT fr.*, 
             p.email as parent_email,
             c.email as child_email,
             p.age_range_min as parent_age_min,
             p.age_range_max as parent_age_max,
             c.age_range_min as child_age_min,
             c.age_range_max as child_age_max
      FROM family_relationships fr
      JOIN users p ON fr.parent_user_id = p.id
      JOIN users c ON fr.child_user_id = c.id
      WHERE fr.parent_user_id = ${currentUser.id} OR fr.child_user_id = ${currentUser.id}
      ORDER BY fr.created_at DESC
    `;

    const relationships = relationshipsResult.map((relationship) => ({
      id: relationship.id,
      parentUserId: relationship.parent_user_id,
      childUserId: relationship.child_user_id,
      parentEmail: relationship.parent_email,
      childEmail: relationship.child_email,
      parentAgeRange: `${relationship.parent_age_min}-${relationship.parent_age_max}`,
      childAgeRange: `${relationship.child_age_min}-${relationship.child_age_max}`,
      relationshipType: relationship.relationship_type,
      childConsentGiven: relationship.child_consent_given,
      createdAt: relationship.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    console.error("Get family relationships error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a family relationship
export async function DELETE(request: NextRequest) {
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

    if (!relationshipId) {
      return NextResponse.json(
        { success: false, error: "Relationship ID is required" },
        { status: 400 }
      );
    }

    const { sql } = await import("@/lib/db");

    // Verify user has permission to delete this relationship
    const relationshipResult = await sql`
      SELECT * FROM family_relationships 
      WHERE id = ${relationshipId} 
        AND (parent_user_id = ${currentUser.id} OR child_user_id = ${currentUser.id})
    `;

    if (relationshipResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Family relationship not found or unauthorized",
        },
        { status: 404 }
      );
    }

    const relationship = relationshipResult[0];

    // Log the relationship removal
    await sql`
      INSERT INTO family_activity_log (
        relationship_id, 
        action_type, 
        performed_by_user_id, 
        details
      )
      VALUES (
        ${relationshipId}, 
        'relationship_removed', 
        ${currentUser.id}, 
        ${JSON.stringify({
          removedBy: currentUser.id,
          timestamp: new Date().toISOString(),
        })}
      )
    `;

    // Remove the relationship
    await sql`
      DELETE FROM family_relationships 
      WHERE id = ${relationshipId}
    `;

    // If this was the last family relationship, disable family mode for both users
    const remainingRelationships = await sql`
      SELECT COUNT(*) as count FROM family_relationships 
      WHERE (parent_user_id = ${relationship.parent_user_id} OR child_user_id = ${relationship.parent_user_id})
         OR (parent_user_id = ${relationship.child_user_id} OR child_user_id = ${relationship.child_user_id})
    `;

    if (parseInt(remainingRelationships[0].count) === 0) {
      await sql`
        UPDATE users 
        SET family_mode_enabled = false 
        WHERE id IN (${relationship.parent_user_id}, ${relationship.child_user_id})
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Family relationship removed successfully",
    });
  } catch (error) {
    console.error("Delete family relationship error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
