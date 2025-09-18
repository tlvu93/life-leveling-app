import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// Validation schema for child consent
const consentSchema = z.object({
  relationshipId: z.string().uuid("Invalid relationship ID"),
  consentGiven: z.boolean(),
});

// POST - Give or revoke child consent for family relationship
export async function POST(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = consentSchema.parse(body);

    const { relationshipId, consentGiven } = validatedData;

    const { sql } = await import("@/lib/db");

    // Verify the relationship exists and the current user is the child
    const relationshipResult = await sql`
      SELECT fr.*, 
             p.email as parent_email,
             c.email as child_email,
             c.age_range_min as child_age_min
      FROM family_relationships fr
      JOIN users p ON fr.parent_user_id = p.id
      JOIN users c ON fr.child_user_id = c.id
      WHERE fr.id = ${relationshipId} AND fr.child_user_id = ${currentUser.id}
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

    // Update consent status
    const updateResult = await sql`
      UPDATE family_relationships 
      SET child_consent_given = ${consentGiven}
      WHERE id = ${relationshipId}
      RETURNING *
    `;

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update consent" },
        { status: 500 }
      );
    }

    // If consent is given, enable family mode for both users
    if (consentGiven) {
      await sql`
        UPDATE users 
        SET family_mode_enabled = true 
        WHERE id IN (${relationship.parent_user_id}, ${relationship.child_user_id})
      `;
    }

    // Log the consent action for transparency
    await sql`
      INSERT INTO family_activity_log (
        relationship_id, 
        action_type, 
        performed_by_user_id, 
        details
      )
      VALUES (
        ${relationshipId}, 
        'consent_updated', 
        ${currentUser.id}, 
        ${JSON.stringify({ consentGiven, timestamp: new Date().toISOString() })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: consentGiven
        ? "Family mode activated successfully"
        : "Family mode consent revoked",
      data: {
        relationshipId: updateResult[0].id,
        childConsentGiven: updateResult[0].child_consent_given,
        familyModeEnabled: consentGiven,
      },
    });
  } catch (error) {
    console.error("Family consent error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get pending consent requests for current user
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

    // Get pending consent requests where current user is the child
    const pendingRequests = await sql`
      SELECT fr.*, 
             p.email as parent_email,
             p.age_range_min as parent_age_min,
             p.age_range_max as parent_age_max
      FROM family_relationships fr
      JOIN users p ON fr.parent_user_id = p.id
      WHERE fr.child_user_id = ${currentUser.id} 
        AND fr.child_consent_given = false
      ORDER BY fr.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: pendingRequests.map((request) => ({
        relationshipId: request.id,
        parentEmail: request.parent_email,
        parentAgeRange: `${request.parent_age_min}-${request.parent_age_max}`,
        relationshipType: request.relationship_type,
        createdAt: request.created_at,
      })),
    });
  } catch (error) {
    console.error("Get consent requests error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
