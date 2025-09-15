import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserByEmail } from "@/lib/database-operations";
import { z } from "zod";

// Validation schema for family linking
const linkFamilySchema = z.object({
  childEmail: z.string().email("Invalid child email address"),
  relationshipType: z.string().default("parent_child"),
});

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
    const validatedData = linkFamilySchema.parse(body);

    const { childEmail, relationshipType } = validatedData;

    // Get parent user profile
    const { sql } = await import("@/lib/db");
    const parentResult = await sql`
      SELECT * FROM users WHERE id = ${currentUser.id}
    `;

    if (parentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Parent user not found" },
        { status: 404 }
      );
    }

    const parentUser = parentResult[0];

    // Check if parent is adult (18+)
    if (parentUser.age_range_min < 18) {
      return NextResponse.json(
        { success: false, error: "Only adults can create family links" },
        { status: 403 }
      );
    }

    // Get child user
    const childUser = await getUserByEmail(childEmail);
    if (!childUser) {
      return NextResponse.json(
        { success: false, error: "Child user not found" },
        { status: 404 }
      );
    }

    // Check if child is actually a minor (under 18)
    if (childUser.ageRangeMin >= 18) {
      return NextResponse.json(
        {
          success: false,
          error: "Family mode is only for linking with minors",
        },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existingRelationship = await sql`
      SELECT * FROM family_relationships 
      WHERE parent_user_id = ${parentUser.id} AND child_user_id = ${childUser.id}
    `;

    if (existingRelationship.length > 0) {
      return NextResponse.json(
        { success: false, error: "Family relationship already exists" },
        { status: 400 }
      );
    }

    // Create family relationship (requires child consent)
    const result = await sql`
      INSERT INTO family_relationships (parent_user_id, child_user_id, relationship_type, child_consent_given)
      VALUES (${parentUser.id}, ${childUser.id}, ${relationshipType}, false)
      RETURNING *
    `;

    const relationship = result[0];

    return NextResponse.json({
      success: true,
      message:
        "Family link request created. Child consent is required to activate.",
      data: {
        relationshipId: relationship.id,
        parentUserId: relationship.parent_user_id,
        childUserId: relationship.child_user_id,
        relationshipType: relationship.relationship_type,
        childConsentGiven: relationship.child_consent_given,
        createdAt: relationship.created_at,
      },
    });
  } catch (error) {
    console.error("Family link error:", error);

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
