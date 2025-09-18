import { sql } from "./db";
import {
  CommitmentLevel,
  SkillLevel,
  CohortStats,
  CohortComparison,
  AgeRange,
} from "@/types";

// Age range definitions for cohort grouping
export const AGE_RANGES: AgeRange[] = [
  { min: 6, max: 9 }, // Elementary
  { min: 10, max: 12 }, // Pre-teen
  { min: 13, max: 15 }, // Early teen
  { min: 16, max: 18 }, // Late teen
  { min: 19, max: 25 }, // Young adult
  { min: 26, max: 35 }, // Adult
  { min: 36, max: 50 }, // Mid-life
  { min: 51, max: 99 }, // Senior
];

/**
 * Determines which age range a user belongs to based on their age
 */
export function getUserAgeRange(
  userAgeMin: number,
  userAgeMax: number
): AgeRange {
  // Find the age range that best fits the user's age range
  for (const range of AGE_RANGES) {
    if (userAgeMin >= range.min && userAgeMax <= range.max) {
      return range;
    }
  }

  // If no exact match, find the range that overlaps most
  let bestMatch = AGE_RANGES[0];
  let maxOverlap = 0;

  for (const range of AGE_RANGES) {
    const overlapStart = Math.max(userAgeMin, range.min);
    const overlapEnd = Math.min(userAgeMax, range.max);
    const overlap = Math.max(0, overlapEnd - overlapStart + 1);

    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestMatch = range;
    }
  }

  return bestMatch;
}

/**
 * Calculates percentile ranking for a user within their cohort
 */
export function calculatePercentile(
  userLevel: SkillLevel,
  cohortStats: CohortStats[]
): number {
  if (cohortStats.length === 0) return 50; // Default to 50th percentile if no data

  let totalUsers = 0;
  let usersBelow = 0;

  for (const stats of cohortStats) {
    totalUsers += stats.userCount;
    if (stats.skillLevel < userLevel) {
      usersBelow += stats.userCount;
    }
  }

  if (totalUsers === 0) return 50;

  // Calculate percentile (users below / total users * 100)
  const percentile = Math.round((usersBelow / totalUsers) * 100);
  return Math.max(1, Math.min(99, percentile)); // Clamp between 1-99
}

/**
 * Generates encouraging message based on percentile and commitment level
 */
export function generateEncouragingMessage(
  percentile: number,
  commitmentLevel: CommitmentLevel,
  interestCategory: string,
  ageRange: AgeRange
): string {
  const ageGroup =
    ageRange.max <= 12 ? "kids" : ageRange.max <= 18 ? "teens" : "people";

  const commitmentText =
    commitmentLevel === CommitmentLevel.CASUAL
      ? "casual"
      : commitmentLevel === CommitmentLevel.AVERAGE
      ? "regular"
      : commitmentLevel === CommitmentLevel.INVESTED
      ? "dedicated"
      : "competitive";

  if (percentile >= 90) {
    return `Amazing! You're in the top 10% of ${commitmentText} ${interestCategory.toLowerCase()} enthusiasts aged ${
      ageRange.min
    }-${ageRange.max}. Keep up the fantastic work! 🌟`;
  } else if (percentile >= 75) {
    return `Great job! You're in the top 25% of ${commitmentText} ${interestCategory.toLowerCase()} learners in your age group (${
      ageRange.min
    }-${ageRange.max}). You're doing really well! 🎉`;
  } else if (percentile >= 50) {
    return `You're doing well! You're above average compared to other ${commitmentText} ${interestCategory.toLowerCase()} ${ageGroup} aged ${
      ageRange.min
    }-${ageRange.max}. Keep exploring and growing! 💪`;
  } else if (percentile >= 25) {
    return `You're on a great learning journey! Many ${commitmentText} ${interestCategory.toLowerCase()} ${ageGroup} in your age group (${
      ageRange.min
    }-${ageRange.max}) are at similar levels. Every step forward counts! 🚀`;
  } else {
    return `Every expert was once a beginner! You're building your ${interestCategory.toLowerCase()} skills alongside other ${commitmentText} learners aged ${
      ageRange.min
    }-${ageRange.max}. Keep going! 🌱`;
  }
}

/**
 * Updates cohort statistics for a specific cohort
 */
export async function updateCohortStatistics(
  ageRange: AgeRange,
  interestCategory: string,
  commitmentLevel: CommitmentLevel
): Promise<void> {
  try {
    // Get all users in this cohort
    const users = await sql`
      SELECT ui.current_level, COUNT(*) as user_count
      FROM user_interests ui
      JOIN users u ON ui.user_id = u.id
      WHERE u.age_range_min >= ${ageRange.min}
        AND u.age_range_max <= ${ageRange.max}
        AND ui.category = ${interestCategory}
        AND ui.intent_level = ${commitmentLevel}
        AND u.privacy_preferences->>'allowPeerComparisons' = 'true'
      GROUP BY ui.current_level
      ORDER BY ui.current_level
    `;

    // Calculate percentile data for each skill level
    const totalUsers = users.reduce(
      (sum, row) => sum + parseInt(row.user_count),
      0
    );

    if (totalUsers === 0) {
      // No users in this cohort, skip updating stats
      return;
    }

    let cumulativeUsers = 0;
    const percentileData: Record<string, number> = {};

    for (const row of users) {
      const skillLevel = row.current_level as SkillLevel;
      const userCount = parseInt(row.user_count);

      // Calculate percentile for users at this level
      const percentile = Math.round((cumulativeUsers / totalUsers) * 100);
      percentileData[skillLevel.toString()] = percentile;

      // Update or insert cohort stats for this skill level
      await sql`
        INSERT INTO cohort_stats (
          age_range_min, age_range_max, interest_category, 
          intent_level, skill_level, user_count, percentile_data
        )
        VALUES (
          ${ageRange.min}, ${ageRange.max}, ${interestCategory},
          ${commitmentLevel}, ${skillLevel}, ${userCount},
          ${JSON.stringify({ percentile, totalCohortSize: totalUsers })}
        )
        ON CONFLICT (age_range_min, age_range_max, interest_category, intent_level, skill_level)
        DO UPDATE SET 
          user_count = EXCLUDED.user_count,
          percentile_data = EXCLUDED.percentile_data,
          updated_at = NOW()
      `;

      cumulativeUsers += userCount;
    }
  } catch (error) {
    console.error("Error updating cohort statistics:", error);
    throw new Error("Failed to update cohort statistics");
  }
}

/**
 * Gets comparison data for a user's interest
 */
export async function getUserComparison(
  userId: string,
  interestCategory: string
): Promise<CohortComparison | null> {
  try {
    // Get user's profile and interest data
    const userResult = await sql`
      SELECT 
        u.age_range_min, u.age_range_max,
        ui.current_level, ui.intent_level,
        u.privacy_preferences->>'allowPeerComparisons' as allow_comparisons
      FROM users u
      JOIN user_interests ui ON u.id = ui.user_id
      WHERE u.id = ${userId} 
        AND ui.category = ${interestCategory}
    `;

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Check if user has opted into comparisons
    if (user.allow_comparisons !== "true") {
      return null;
    }

    const userAgeRange = getUserAgeRange(
      user.age_range_min,
      user.age_range_max
    );
    const userLevel = user.current_level as SkillLevel;
    const commitmentLevel = user.intent_level as CommitmentLevel;

    // Get cohort statistics
    const cohortStats = await sql`
      SELECT * FROM cohort_stats
      WHERE age_range_min = ${userAgeRange.min}
        AND age_range_max = ${userAgeRange.max}
        AND interest_category = ${interestCategory}
        AND intent_level = ${commitmentLevel}
      ORDER BY skill_level ASC
    `;

    if (cohortStats.length === 0) {
      // No cohort data available, trigger stats update
      await updateCohortStatistics(
        userAgeRange,
        interestCategory,
        commitmentLevel
      );

      // Try again after update
      const updatedStats = await sql`
        SELECT * FROM cohort_stats
        WHERE age_range_min = ${userAgeRange.min}
          AND age_range_max = ${userAgeRange.max}
          AND interest_category = ${interestCategory}
          AND intent_level = ${commitmentLevel}
        ORDER BY skill_level ASC
      `;

      if (updatedStats.length === 0) {
        return null; // Still no data available
      }
    }

    // Convert to CohortStats objects
    const statsObjects: CohortStats[] = cohortStats.map((stat) => ({
      id: stat.id,
      ageRangeMin: stat.age_range_min,
      ageRangeMax: stat.age_range_max,
      interestCategory: stat.interest_category,
      intentLevel: stat.intent_level as CommitmentLevel,
      skillLevel: stat.skill_level as SkillLevel,
      userCount: stat.user_count,
      percentileData: stat.percentile_data,
      updatedAt: stat.updated_at,
    }));

    // Calculate user's percentile
    const percentile = calculatePercentile(userLevel, statsObjects);

    // Calculate total cohort size
    const cohortSize = statsObjects.reduce(
      (sum, stat) => sum + stat.userCount,
      0
    );

    // Generate encouraging message
    const encouragingMessage = generateEncouragingMessage(
      percentile,
      commitmentLevel,
      interestCategory,
      userAgeRange
    );

    return {
      userId,
      interest: interestCategory,
      percentile,
      cohortSize,
      ageRange: userAgeRange,
      intentLevel: commitmentLevel,
      encouragingMessage,
    };
  } catch (error) {
    console.error("Error getting user comparison:", error);
    throw new Error("Failed to get user comparison");
  }
}

/**
 * Gets all comparisons for a user's interests
 */
export async function getAllUserComparisons(
  userId: string
): Promise<CohortComparison[]> {
  try {
    // Get all user interests
    const interests = await sql`
      SELECT category FROM user_interests 
      WHERE user_id = ${userId}
    `;

    const comparisons: CohortComparison[] = [];

    for (const interest of interests) {
      const comparison = await getUserComparison(userId, interest.category);
      if (comparison) {
        comparisons.push(comparison);
      }
    }

    return comparisons;
  } catch (error) {
    console.error("Error getting all user comparisons:", error);
    throw new Error("Failed to get user comparisons");
  }
}

/**
 * Updates all cohort statistics (should be run periodically)
 */
export async function updateAllCohortStatistics(): Promise<void> {
  try {
    // Get all unique combinations of age ranges, interests, and commitment levels
    const combinations = await sql`
      SELECT DISTINCT 
        u.age_range_min, u.age_range_max,
        ui.category, ui.intent_level
      FROM user_interests ui
      JOIN users u ON ui.user_id = u.id
      WHERE u.privacy_preferences->>'allowPeerComparisons' = 'true'
    `;

    for (const combo of combinations) {
      const ageRange = getUserAgeRange(
        combo.age_range_min,
        combo.age_range_max
      );
      await updateCohortStatistics(
        ageRange,
        combo.category,
        combo.intent_level as CommitmentLevel
      );
    }
  } catch (error) {
    console.error("Error updating all cohort statistics:", error);
    throw new Error("Failed to update all cohort statistics");
  }
}

/**
 * Checks if a user has opted into peer comparisons
 */
export async function hasUserOptedIntoComparisons(
  userId: string
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT privacy_preferences->>'allowPeerComparisons' as allow_comparisons
      FROM users
      WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return false;
    }

    return result[0].allow_comparisons === "true";
  } catch (error) {
    console.error("Error checking user comparison opt-in:", error);
    return false;
  }
}

/**
 * Updates user's peer comparison preference
 */
export async function updateUserComparisonPreference(
  userId: string,
  allowComparisons: boolean
): Promise<void> {
  try {
    await sql`
      UPDATE users
      SET privacy_preferences = privacy_preferences || jsonb_build_object('allowPeerComparisons', ${allowComparisons})
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error("Error updating user comparison preference:", error);
    throw new Error("Failed to update comparison preference");
  }
}
