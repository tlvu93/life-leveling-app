import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const getAlertsSchema = z.object({
  relationshipId: z.string().uuid(),
});

const updateAlertSchema = z.object({
  alertId: z.string().uuid(),
  resolved: z.boolean(),
});

// GET - Get safety alerts for a family relationship
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

    // Get safety alerts for this relationship
    const alertsResult = await sql`
      SELECT * FROM family_safety_alerts 
      WHERE relationship_id = ${relationshipId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const alerts = alertsResult.map((alert) => ({
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.created_at,
      resolved: alert.resolved,
    }));

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Get safety alerts error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update safety alert (mark as resolved)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    const { alertId, resolved } = validatedData;

    const { sql } = await import("@/lib/db");

    // Verify user has permission to update this alert
    const alertResult = await sql`
      SELECT fsa.*, fr.parent_user_id, fr.child_user_id
      FROM family_safety_alerts fsa
      JOIN family_relationships fr ON fsa.relationship_id = fr.id
      WHERE fsa.id = ${alertId} 
        AND (fr.parent_user_id = ${currentUser.id} OR fr.child_user_id = ${currentUser.id})
    `;

    if (alertResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Safety alert not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update alert status
    const updateResult = await sql`
      UPDATE family_safety_alerts 
      SET resolved = ${resolved}, resolved_at = ${resolved ? "NOW()" : null}
      WHERE id = ${alertId}
      RETURNING *
    `;

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update alert" },
        { status: 500 }
      );
    }

    // Log the alert resolution
    await sql`
      INSERT INTO family_activity_log (
        relationship_id, 
        action_type, 
        performed_by_user_id, 
        details
      )
      VALUES (
        ${alertResult[0].relationship_id}, 
        'alert_resolved', 
        ${currentUser.id}, 
        ${JSON.stringify({
          alertId,
          alertType: alertResult[0].alert_type,
          resolved,
          timestamp: new Date().toISOString(),
        })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: resolved ? "Alert marked as resolved" : "Alert reopened",
      data: {
        id: updateResult[0].id,
        resolved: updateResult[0].resolved,
      },
    });
  } catch (error) {
    console.error("Update safety alert error:", error);

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

// POST - Create a new safety alert
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
    const { relationshipId, alertType, severity, message } = body;

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

    // Create safety alert
    const alertResult = await sql`
      INSERT INTO family_safety_alerts (
        relationship_id, 
        alert_type, 
        severity, 
        message,
        created_by_user_id
      )
      VALUES (
        ${relationshipId}, 
        ${alertType}, 
        ${severity}, 
        ${message},
        ${currentUser.id}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: "Safety alert created",
      data: {
        id: alertResult[0].id,
        type: alertResult[0].alert_type,
        severity: alertResult[0].severity,
        message: alertResult[0].message,
        timestamp: alertResult[0].created_at,
      },
    });
  } catch (error) {
    console.error("Create safety alert error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
