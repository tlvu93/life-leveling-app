import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { z } from "zod";

// GET - Get parent dashboard data for viewing child interests and goals
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
    const childUserId = searchParams.get("childUserId");

    if (!childUserId) {
      return NextResponse.json(
        { success: false, error: "Child user ID is required" },
        { status: 400 }
      );
    }

    const { sql } = await import("@/lib/db");

    // Verify family relationship exists and child has given consent
    const relationshipResult = await sql`
      SELECT fr.*, 
             c.email as child_email,
             c.age_range_min as child_age_min,
             c.age_range_max as child_age_max,
             c.privacy_preferences as child_privacy_preferences
      FROM family_relationships fr
      JOIN users c ON fr.child_user_id = c.id
      WHERE fr.parent_user_id = ${currentUser.id} 
        AND fr.child_user_id = ${childUserId}
        AND fr.child_consent_given = true
    `;

    if (relationshipResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Family relationship not found or consent not given",
        },
        { status: 403 }
      );
    }

    const relationship = relationshipResult[0];
    const childPrivacyPrefs = relationship.child_privacy_preferences || {};

    // Check if child allows family viewing
    if (!childPrivacyPrefs.allowFamilyViewing) {
      return NextResponse.json(
        { success: false, error: "Child has not allowed family viewing" },
        { status: 403 }
      );
    }

    // Get child's interests (always visible in family mode)
    const interestsResult = await sql`
      SELECT category, subcategory, current_level, intent_level, updated_at
      FROM user_interests 
      WHERE user_id = ${childUserId}
      ORDER BY category
    `;

    // Get child's goals (only if child allows sharing goals with family)
    let goalsResult = [];
    if (childPrivacyPrefs.shareGoalsWithFamily) {
      goalsResult = await sql`
        SELECT id, interest_category, goal_type, title, description, 
               target_level, timeframe, status, created_at, target_date
        FROM goals 
        WHERE user_id = ${childUserId} AND status = 'active'
        ORDER BY created_at DESC
      `;
    }

    // Get child's recent progress (only if child allows sharing progress with family)
    let progressResult = [];
    if (childPrivacyPrefs.shareProgressWithFamily) {
      progressResult = await sql`
        SELECT sh.*, ui.category, ui.subcategory
        FROM skill_history sh
        JOIN user_interests ui ON sh.user_interest_id = ui.id
        WHERE ui.user_id = ${childUserId}
        ORDER BY sh.changed_at DESC
        LIMIT 10
      `;
    }

    // Log the family dashboard access for transparency
    await sql`
      INSERT INTO family_activity_log (
        relationship_id, 
        action_type, 
        performed_by_user_id, 
        details
      )
      VALUES (
        ${relationship.id}, 
        'dashboard_accessed', 
        ${currentUser.id}, 
        ${JSON.stringify({
          childUserId,
          timestamp: new Date().toISOString(),
          dataAccessed: {
            interests: true,
            goals: childPrivacyPrefs.shareGoalsWithFamily || false,
            progress: childPrivacyPrefs.shareProgressWithFamily || false,
          },
        })}
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        childInfo: {
          email: relationship.child_email,
          ageRange: `${relationship.child_age_min}-${relationship.child_age_max}`,
        },
        interests: interestsResult.map((interest) => ({
          category: interest.category,
          subcategory: interest.subcategory,
          currentLevel: interest.current_level,
          intentLevel: interest.intent_level,
          lastUpdated: interest.updated_at,
        })),
        goals: goalsResult.map((goal) => ({
          id: goal.id,
          interestCategory: goal.interest_category,
          goalType: goal.goal_type,
          title: goal.title,
          description: goal.description,
          targetLevel: goal.target_level,
          timeframe: goal.timeframe,
          status: goal.status,
          createdAt: goal.created_at,
          targetDate: goal.target_date,
        })),
        recentProgress: progressResult.map((progress) => ({
          category: progress.category,
          subcategory: progress.subcategory,
          previousLevel: progress.previous_level,
          newLevel: progress.new_level,
          changedAt: progress.changed_at,
          notes: progress.notes,
        })),
        privacySettings: {
          allowFamilyViewing: childPrivacyPrefs.allowFamilyViewing || false,
          shareGoalsWithFamily: childPrivacyPrefs.shareGoalsWithFamily || false,
          shareProgressWithFamily:
            childPrivacyPrefs.shareProgressWithFamily || false,
        },
      },
    });
  } catch (error) {
    console.error("Family dashboard error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
