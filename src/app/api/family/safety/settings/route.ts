import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// Validation schema for safety settings
const safetySettingsSchema = z.object({
  relationshipId: z.string().uuid(),
  settings: z.object({
    enableActivityAlerts: z.boolean(),
    enablePrivacyChangeAlerts: z.boolean(),
    enableUnusualActivityDetection: z.boolean(),
    requireParentApprovalForNewConnections: z.boolean(),
    maxDailyInteractionTime: z.number().min(15).max(180),
    allowedInteractionHours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
  }),
});

// GET - Get safety settings for a family relationship
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

    // Get safety settings for this relationship
    const settingsResult = await sql`
      SELECT * FROM family_safety_settings 
      WHERE relationship_id = ${relationshipId}
    `;

    let settings;
    if (settingsResult.length === 0) {
      // Return default settings if none exist
      settings = {
        enableActivityAlerts: true,
        enablePrivacyChangeAlerts: true,
        enableUnusualActivityDetection: true,
        requireParentApprovalForNewConnections: true,
        maxDailyInteractionTime: 60,
        allowedInteractionHours: {
          start: "08:00",
          end: "20:00",
        },
      };
    } else {
      const dbSettings = settingsResult[0];
      settings = {
        enableActivityAlerts: dbSettings.enable_activity_alerts,
        enablePrivacyChangeAlerts: dbSettings.enable_privacy_change_alerts,
        enableUnusualActivityDetection:
          dbSettings.enable_unusual_activity_detection,
        requireParentApprovalForNewConnections:
          dbSettings.require_parent_approval_for_new_connections,
        maxDailyInteractionTime: dbSettings.max_daily_interaction_time,
        allowedInteractionHours: dbSettings.allowed_interaction_hours,
      };
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get safety settings error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update safety settings for a family relationship
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
    const validatedData = safetySettingsSchema.parse(body);

    const { relationshipId, settings } = validatedData;

    const { sql } = await import("@/lib/db");

    // Verify user has permission to update settings (must be parent)
    const relationshipResult = await sql`
      SELECT * FROM family_relationships 
      WHERE id = ${relationshipId} 
        AND parent_user_id = ${currentUser.id}
        AND child_consent_given = true
    `;

    if (relationshipResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Only parents can modify safety settings" },
        { status: 403 }
      );
    }

    // Upsert safety settings
    const settingsResult = await sql`
      INSERT INTO family_safety_settings (
        relationship_id,
        enable_activity_alerts,
        enable_privacy_change_alerts,
        enable_unusual_activity_detection,
        require_parent_approval_for_new_connections,
        max_daily_interaction_time,
        allowed_interaction_hours,
        updated_by_user_id
      )
      VALUES (
        ${relationshipId},
        ${settings.enableActivityAlerts},
        ${settings.enablePrivacyChangeAlerts},
        ${settings.enableUnusualActivityDetection},
        ${settings.requireParentApprovalForNewConnections},
        ${settings.maxDailyInteractionTime},
        ${JSON.stringify(settings.allowedInteractionHours)},
        ${currentUser.id}
      )
      ON CONFLICT (relationship_id) 
      DO UPDATE SET
        enable_activity_alerts = EXCLUDED.enable_activity_alerts,
        enable_privacy_change_alerts = EXCLUDED.enable_privacy_change_alerts,
        enable_unusual_activity_detection = EXCLUDED.enable_unusual_activity_detection,
        require_parent_approval_for_new_connections = EXCLUDED.require_parent_approval_for_new_connections,
        max_daily_interaction_time = EXCLUDED.max_daily_interaction_time,
        allowed_interaction_hours = EXCLUDED.allowed_interaction_hours,
        updated_by_user_id = EXCLUDED.updated_by_user_id,
        updated_at = NOW()
      RETURNING *
    `;

    // Log the settings change
    await sql`
      INSERT INTO family_activity_log (
        relationship_id, 
        action_type, 
        performed_by_user_id, 
        details
      )
      VALUES (
        ${relationshipId}, 
        'safety_settings_updated', 
        ${currentUser.id}, 
        ${JSON.stringify({
          settings,
          timestamp: new Date().toISOString(),
        })}
      )
    `;

    // Create a safety alert for the child about the settings change
    await sql`
      INSERT INTO family_safety_alerts (
        relationship_id, 
        alert_type, 
        severity, 
        message,
        created_by_user_id
      )
      VALUES (
        ${relationshipId}, 
        'settings_changed', 
        'low', 
        'Family safety settings have been updated by your parent',
        ${currentUser.id}
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Safety settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update safety settings error:", error);

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
