import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// Validation schema for child consent
const consentSchema = z.object({
  relationshipId: z.string().uuid("Invalid relationship ID"),
  consentGiven: z.boolean(),
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
    const validatedData = consentSchema.parse(body);

    const { relationshipId, consentGiven } = validatedData;

    const { sql } = await import("@/lib/db");

    // Get the family relationship
    const relationshipResult = await sql`
      SELECT * FROM family_relationships 
      WHERE id = ${relationshipId} AND child_user_id = ${currentUser.id}
    `;

    if (relationshipResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Family relationship not found or you don't have permission",
        },
        { status: 404 }
      );
    }

    const relationship = relationshipResult[0];

    if (consentGiven) {
      // Grant consent and enable family mode for both users
      await sql`
        UPDATE family_relationships 
        SET child_consent_given = true 
        WHERE id = ${relationshipId}
      `;

      // Enable family mode for both parent and child
      await sql`
        UPDATE users 
        SET family_mode_enabled = true 
        WHERE id = ${relationship.parent_user_id} OR id = ${relationship.child_user_id}
      `;

      return NextResponse.json({
        success: true,
        message: "Family mode activated successfully",
        data: {
          relationshipId: relationship.id,
          childConsentGiven: true,
          familyModeEnabled: true,
        },
      });
    } else {
      // Deny consent and delete the relationship request
      await sql`
        DELETE FROM family_relationships 
        WHERE id = ${relationshipId}
      `;

      return NextResponse.json({
        success: true,
        message: "Family link request declined and removed",
        data: {
          relationshipId: relationship.id,
          childConsentGiven: false,
        },
      });
    }
  } catch (error) {
    console.error("Family consent error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
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
