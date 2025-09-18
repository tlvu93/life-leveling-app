"use server";

import { revalidatePath } from "next/cache";
import {
  updateUserInterestLevel,
  getUserInterests,
} from "@/lib/database-operations";
import { SkillLevel, Interest } from "@/types";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

interface UpdateSkillLevelParams {
  interestId: string;
  newLevel: SkillLevel;
  notes?: string;
}

interface BulkUpdateSkillsParams {
  updates: Array<{
    interestId: string;
    newLevel: SkillLevel;
    notes?: string;
  }>;
}

/**
 * Server Action to update a single skill level
 */
export async function updateSkillLevel(params: UpdateSkillLevelParams) {
  try {
    // Get user ID from auth token
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return { success: false, error: "Invalid token" };
    }

    const userId = decoded.userId;

    // Get current interest to check previous level
    const userInterests = await getUserInterests(userId);
    const currentInterest = userInterests.find(
      (i) => i.id === params.interestId
    );

    if (!currentInterest) {
      return { success: false, error: "Interest not found" };
    }

    const previousLevel = currentInterest.currentLevel;

    // Update the interest level (this function already creates skill history)
    const updatedInterest = await updateUserInterestLevel(
      params.interestId,
      params.newLevel
    );

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        previousLevel,
        newLevel: params.newLevel,
        interestId: params.interestId,
      },
    };
  } catch (error) {
    console.error("Error updating skill level:", error);
    return {
      success: false,
      error: "Failed to update skill level",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action to update multiple skill levels at once
 */
export async function bulkUpdateSkills(params: BulkUpdateSkillsParams) {
  try {
    // Get user ID from auth token
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return { success: false, error: "Invalid token" };
    }

    const userId = decoded.userId;

    // Get current interests
    const userInterests = await getUserInterests(userId);

    const results = [];
    const errors = [];

    // Process each update
    for (const update of params.updates) {
      try {
        const currentInterest = userInterests.find(
          (i) => i.id === update.interestId
        );

        if (!currentInterest) {
          errors.push({
            interestId: update.interestId,
            error: "Interest not found",
          });
          continue;
        }

        const previousLevel = currentInterest.currentLevel;

        // Skip if no change
        if (previousLevel === update.newLevel) {
          continue;
        }

        // Update the interest level (this function already creates skill history)
        const updatedInterest = await updateUserInterestLevel(
          update.interestId,
          update.newLevel
        );

        results.push({
          interestId: update.interestId,
          previousLevel,
          newLevel: update.newLevel,
        });
      } catch (error) {
        errors.push({
          interestId: update.interestId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        updated: results,
        errors,
        totalUpdated: results.length,
        totalErrors: errors.length,
      },
    };
  } catch (error) {
    console.error("Error bulk updating skills:", error);
    return {
      success: false,
      error: "Failed to bulk update skills",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action to refresh matrix data
 */
export async function refreshMatrixData() {
  try {
    // Get user ID from auth token
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return { success: false, error: "Invalid token" };
    }

    const userId = decoded.userId;

    // Get fresh user interests
    const interests = await getUserInterests(userId);

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      data: interests,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error refreshing matrix data:", error);
    return {
      success: false,
      error: "Failed to refresh matrix data",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action to create a retrospective entry with skill updates
 */
export async function createRetrospectiveWithSkillUpdates(params: {
  type: "weekly" | "monthly" | "yearly";
  insights?: Record<string, unknown>;
  skillUpdates: Record<string, SkillLevel>;
  goalsReviewed?: string[];
}) {
  try {
    // Get user ID from auth token
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return { success: false, error: "Invalid token" };
    }

    const userId = decoded.userId;

    // Get current interests to find interest IDs
    const userInterests = await getUserInterests(userId);

    // Process skill updates
    const skillUpdateResults = [];
    for (const [category, newLevel] of Object.entries(params.skillUpdates)) {
      const interest = userInterests.find((i) => i.category === category);
      if (interest && interest.currentLevel !== newLevel) {
        const result = await updateSkillLevel({
          interestId: interest.id,
          newLevel,
          notes: `Updated during ${params.type} retrospective`,
        });
        skillUpdateResults.push({ category, result });
      }
    }

    // TODO: Create retrospective entry in database
    // This would require implementing the retrospective creation function

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        type: params.type,
        skillUpdates: skillUpdateResults,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error creating retrospective:", error);
    return {
      success: false,
      error: "Failed to create retrospective",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
