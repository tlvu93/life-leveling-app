import { sql } from "./db";
import {
  UserProfile,
  Interest,
  Goal,
  Retrospective,
  SkillHistoryEntry,
  CohortStats,
  FamilyRelationship,
  PredefinedPath,
  UserPathProgress,
  SimulationScenario,
  SkillLevel,
  CommitmentLevel,
  GoalType,
  Timeframe,
  GoalStatus,
  RetrospectiveType,
} from "@/types";

// User Operations
export async function createUser(userData: {
  email: string;
  passwordHash: string;
  ageRangeMin: number;
  ageRangeMax: number;
  familyModeEnabled?: boolean;
}): Promise<UserProfile> {
  try {
    const result = await sql`
      INSERT INTO users (email, password_hash, age_range_min, age_range_max, family_mode_enabled)
      VALUES (${userData.email}, ${userData.passwordHash}, ${
      userData.ageRangeMin
    }, ${userData.ageRangeMax}, ${userData.familyModeEnabled || false})
      RETURNING *
    `;

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      ageRangeMin: user.age_range_min,
      ageRangeMax: user.age_range_max,
      interests: [],
      familyModeEnabled: user.family_mode_enabled,
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at,
      lastActive: user.last_active,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const userResult = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get user interests
    const interestsResult = await sql`
      SELECT * FROM user_interests WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `;

    const interests: Interest[] = interestsResult.map((interest) => ({
      id: interest.id,
      userId: interest.user_id,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.current_level as SkillLevel,
      intentLevel: interest.intent_level as CommitmentLevel,
      createdAt: interest.created_at,
      updatedAt: interest.updated_at,
    }));

    return {
      id: user.id,
      email: user.email,
      ageRangeMin: user.age_range_min,
      ageRangeMax: user.age_range_max,
      interests,
      familyModeEnabled: user.family_mode_enabled,
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at,
      lastActive: user.last_active,
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw new Error("Failed to get user");
  }
}

export async function getUserByEmail(
  email: string
): Promise<UserProfile | null> {
  try {
    console.log("Attempting to get user by email:", email);

    const result = await sql`
      SELECT id, email, age_range_min, age_range_max, family_mode_enabled, onboarding_completed, created_at, last_active 
      FROM users WHERE email = ${email}
    `;

    console.log("Query result:", result);

    if (result.length === 0) {
      console.log("No user found with email:", email);
      return null;
    }

    const user = result[0];
    return getUserById(user.id);
  } catch (error) {
    console.error("Error getting user by email:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      severity: error.severity,
    });
    throw new Error("Failed to get user by email");
  }
}

export async function getUserWithPasswordByEmail(
  email: string
): Promise<{ user: UserProfile; passwordHash: string } | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (result.length === 0) {
      return null;
    }

    const dbUser = result[0];
    const user = await getUserById(dbUser.id);

    if (!user) {
      return null;
    }

    return {
      user,
      passwordHash: dbUser.password_hash,
    };
  } catch (error) {
    console.error("Error getting user with password by email:", error);
    throw new Error("Failed to get user with password by email");
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET last_active = NOW() 
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error("Error updating user last active:", error);
    throw new Error("Failed to update user last active");
  }
}

export async function completeOnboarding(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET onboarding_completed = true 
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error("Error completing onboarding:", error);
    throw new Error("Failed to complete onboarding");
  }
}

// Interest Operations
export async function createUserInterest(interestData: {
  userId: string;
  category: string;
  subcategory?: string;
  currentLevel: SkillLevel;
  intentLevel: CommitmentLevel;
}): Promise<Interest> {
  try {
    const result = await sql`
      INSERT INTO user_interests (user_id, category, subcategory, current_level, intent_level)
      VALUES (${interestData.userId}, ${interestData.category}, ${
      interestData.subcategory || null
    }, ${interestData.currentLevel}, ${interestData.intentLevel})
      ON CONFLICT (user_id, category, subcategory)
      DO UPDATE SET 
        current_level = EXCLUDED.current_level,
        intent_level = EXCLUDED.intent_level,
        updated_at = NOW()
      RETURNING *
    `;

    // Get user age range for cohort updates
    const userResult = await sql`
      SELECT age_range_min, age_range_max FROM users WHERE id = ${interestData.userId}
    `;

    if (userResult.length > 0) {
      const { age_range_min, age_range_max } = userResult[0];

      // Trigger cohort stats update in background (don't await to avoid blocking)
      import("@/lib/cohort-operations").then(
        ({ getUserAgeRange, updateCohortStatistics }) => {
          const ageRange = getUserAgeRange(age_range_min, age_range_max);
          updateCohortStatistics(
            ageRange,
            interestData.category,
            interestData.intentLevel
          ).catch((error) => {
            console.error("Background cohort stats update failed:", error);
          });
        }
      );
    }

    const interest = result[0];
    return {
      id: interest.id,
      userId: interest.user_id,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.current_level as SkillLevel,
      intentLevel: interest.intent_level as CommitmentLevel,
      createdAt: interest.created_at,
      updatedAt: interest.updated_at,
    };
  } catch (error) {
    console.error("Error creating user interest:", error);
    throw new Error("Failed to create user interest");
  }
}

export async function updateUserInterestLevel(
  interestId: string,
  newLevel: SkillLevel,
  retrospectiveId?: string
): Promise<Interest> {
  try {
    // Get current level and user info for history tracking and cohort updates
    const currentResult = await sql`
      SELECT ui.current_level, ui.category, ui.intent_level, u.age_range_min, u.age_range_max
      FROM user_interests ui
      JOIN users u ON ui.user_id = u.id
      WHERE ui.id = ${interestId}
    `;

    if (currentResult.length === 0) {
      throw new Error("Interest not found");
    }

    const previousLevel = currentResult[0].current_level;
    const category = currentResult[0].category;
    const intentLevel = currentResult[0].intent_level as CommitmentLevel;
    const ageRangeMin = currentResult[0].age_range_min;
    const ageRangeMax = currentResult[0].age_range_max;

    // Update the interest level
    const result = await sql`
      UPDATE user_interests 
      SET current_level = ${newLevel}, updated_at = NOW()
      WHERE id = ${interestId}
      RETURNING *
    `;

    // Record the change in skill history
    await sql`
      INSERT INTO skill_history (user_interest_id, previous_level, new_level, retrospective_id)
      VALUES (${interestId}, ${previousLevel}, ${newLevel}, ${
      retrospectiveId || null
    })
    `;

    // Trigger cohort stats update in background (don't await to avoid blocking)
    import("@/lib/cohort-operations").then(
      ({ getUserAgeRange, updateCohortStatistics }) => {
        const ageRange = getUserAgeRange(ageRangeMin, ageRangeMax);
        updateCohortStatistics(ageRange, category, intentLevel).catch(
          (error) => {
            console.error("Background cohort stats update failed:", error);
          }
        );
      }
    );

    const interest = result[0];
    return {
      id: interest.id,
      userId: interest.user_id,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.current_level as SkillLevel,
      intentLevel: interest.intent_level as CommitmentLevel,
      createdAt: interest.created_at,
      updatedAt: interest.updated_at,
    };
  } catch (error) {
    console.error("Error updating user interest level:", error);
    throw new Error("Failed to update user interest level");
  }
}

export async function getUserInterests(userId: string): Promise<Interest[]> {
  try {
    const result = await sql`
      SELECT * FROM user_interests 
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `;

    return result.map((interest) => ({
      id: interest.id,
      userId: interest.user_id,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.current_level as SkillLevel,
      intentLevel: interest.intent_level as CommitmentLevel,
      createdAt: interest.created_at,
      updatedAt: interest.updated_at,
    }));
  } catch (error) {
    console.error("Error getting user interests:", error);
    throw new Error("Failed to get user interests");
  }
}

// Goal Operations
export async function createGoal(goalData: {
  userId: string;
  interestCategory: string;
  goalType: GoalType;
  title: string;
  description: string;
  targetLevel?: SkillLevel;
  timeframe: Timeframe;
  targetDate?: Date;
}): Promise<Goal> {
  try {
    const result = await sql`
      INSERT INTO goals (user_id, interest_category, goal_type, title, description, target_level, timeframe, target_date)
      VALUES (${goalData.userId}, ${goalData.interestCategory}, ${
      goalData.goalType
    }, ${goalData.title}, ${goalData.description}, ${
      goalData.targetLevel || null
    }, ${goalData.timeframe}, ${goalData.targetDate || null})
      RETURNING *
    `;

    const goal = result[0];
    return {
      id: goal.id,
      userId: goal.user_id,
      interestCategory: goal.interest_category,
      goalType: goal.goal_type as GoalType,
      title: goal.title,
      description: goal.description,
      targetLevel: goal.target_level as SkillLevel,
      timeframe: goal.timeframe as Timeframe,
      status: goal.status as GoalStatus,
      createdAt: goal.created_at,
      targetDate: goal.target_date,
      completedAt: goal.completed_at,
    };
  } catch (error) {
    console.error("Error creating goal:", error);
    throw new Error("Failed to create goal");
  }
}

export async function getUserGoals(
  userId: string,
  status?: GoalStatus
): Promise<Goal[]> {
  try {
    let query;
    if (status) {
      query = sql`
        SELECT * FROM goals 
        WHERE user_id = ${userId} AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM goals 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    }

    const result = await query;

    return result.map((goal) => ({
      id: goal.id,
      userId: goal.user_id,
      interestCategory: goal.interest_category,
      goalType: goal.goal_type as GoalType,
      title: goal.title,
      description: goal.description,
      targetLevel: goal.target_level as SkillLevel,
      timeframe: goal.timeframe as Timeframe,
      status: goal.status as GoalStatus,
      createdAt: goal.created_at,
      targetDate: goal.target_date,
      completedAt: goal.completed_at,
    }));
  } catch (error) {
    console.error("Error getting user goals:", error);
    throw new Error("Failed to get user goals");
  }
}

export async function updateGoalStatus(
  goalId: string,
  status: GoalStatus
): Promise<Goal> {
  try {
    const result = await sql`
      UPDATE goals 
      SET status = ${status}, 
          completed_at = ${status === GoalStatus.COMPLETED ? new Date() : null}
      WHERE id = ${goalId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error("Goal not found");
    }

    const goal = result[0];
    return {
      id: goal.id,
      userId: goal.user_id,
      interestCategory: goal.interest_category,
      goalType: goal.goal_type as GoalType,
      title: goal.title,
      description: goal.description,
      targetLevel: goal.target_level as SkillLevel,
      timeframe: goal.timeframe as Timeframe,
      status: goal.status as GoalStatus,
      createdAt: goal.created_at,
      targetDate: goal.target_date,
      completedAt: goal.completed_at,
    };
  } catch (error) {
    console.error("Error updating goal status:", error);
    throw new Error("Failed to update goal status");
  }
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  try {
    const result = await sql`
      SELECT * FROM goals WHERE id = ${goalId}
    `;

    if (result.length === 0) {
      return null;
    }

    const goal = result[0];
    return {
      id: goal.id,
      userId: goal.user_id,
      interestCategory: goal.interest_category,
      goalType: goal.goal_type as GoalType,
      title: goal.title,
      description: goal.description,
      targetLevel: goal.target_level as SkillLevel,
      timeframe: goal.timeframe as Timeframe,
      status: goal.status as GoalStatus,
      createdAt: goal.created_at,
      targetDate: goal.target_date,
      completedAt: goal.completed_at,
    };
  } catch (error) {
    console.error("Error getting goal by ID:", error);
    throw new Error("Failed to get goal");
  }
}

export async function updateGoal(
  goalId: string,
  updates: Partial<{
    title: string;
    description: string;
    targetLevel: SkillLevel;
    timeframe: Timeframe;
    targetDate: Date;
  }>
): Promise<Goal> {
  try {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.targetLevel !== undefined) {
      setParts.push(`target_level = $${paramIndex++}`);
      values.push(updates.targetLevel);
    }
    if (updates.timeframe !== undefined) {
      setParts.push(`timeframe = $${paramIndex++}`);
      values.push(updates.timeframe);
    }
    if (updates.targetDate !== undefined) {
      setParts.push(`target_date = $${paramIndex++}`);
      values.push(updates.targetDate);
    }

    if (setParts.length === 0) {
      throw new Error("No updates provided");
    }

    values.push(goalId);
    const query = `
      UPDATE goals 
      SET ${setParts.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.unsafe(query, values);

    if (result.length === 0) {
      throw new Error("Goal not found");
    }

    const goal = result[0];
    return {
      id: goal.id,
      userId: goal.user_id,
      interestCategory: goal.interest_category,
      goalType: goal.goal_type as GoalType,
      title: goal.title,
      description: goal.description,
      targetLevel: goal.target_level as SkillLevel,
      timeframe: goal.timeframe as Timeframe,
      status: goal.status as GoalStatus,
      createdAt: goal.created_at,
      targetDate: goal.target_date,
      completedAt: goal.completed_at,
    };
  } catch (error) {
    console.error("Error updating goal:", error);
    throw new Error("Failed to update goal");
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM goals WHERE id = ${goalId}
    `;

    if (result.count === 0) {
      throw new Error("Goal not found");
    }
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw new Error("Failed to delete goal");
  }
}

// Retrospective Operations
export async function createRetrospective(retrospectiveData: {
  userId: string;
  type: RetrospectiveType;
  insights?: Record<string, any>;
  skillUpdates?: Record<string, any>;
  goalsReviewed?: Record<string, unknown>;
}): Promise<Retrospective> {
  try {
    const result = await sql`
      INSERT INTO retrospectives (user_id, type, insights, skill_updates, goals_reviewed)
      VALUES (${retrospectiveData.userId}, ${
      retrospectiveData.type
    }, ${JSON.stringify(retrospectiveData.insights || {})}, ${JSON.stringify(
      retrospectiveData.skillUpdates || {}
    )}, ${JSON.stringify(retrospectiveData.goalsReviewed || {})})
      RETURNING *
    `;

    const retrospective = result[0];
    return {
      id: retrospective.id,
      userId: retrospective.user_id,
      type: retrospective.type as RetrospectiveType,
      completedAt: retrospective.completed_at,
      insights: retrospective.insights,
      skillUpdates: retrospective.skill_updates,
      goalsReviewed: retrospective.goals_reviewed,
    };
  } catch (error) {
    console.error("Error creating retrospective:", error);
    throw new Error("Failed to create retrospective");
  }
}

export async function getUserRetrospectives(
  userId: string,
  type?: RetrospectiveType
): Promise<Retrospective[]> {
  try {
    let query;
    if (type) {
      query = sql`
        SELECT * FROM retrospectives 
        WHERE user_id = ${userId} AND type = ${type}
        ORDER BY completed_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM retrospectives 
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `;
    }

    const result = await query;

    return result.map((retrospective) => ({
      id: retrospective.id,
      userId: retrospective.user_id,
      type: retrospective.type as RetrospectiveType,
      completedAt: retrospective.completed_at,
      insights: retrospective.insights,
      skillUpdates: retrospective.skill_updates,
      goalsReviewed: retrospective.goals_reviewed,
    }));
  } catch (error) {
    console.error("Error getting user retrospectives:", error);
    throw new Error("Failed to get user retrospectives");
  }
}

// Skill History Operations
export async function getSkillHistory(
  userInterestId: string
): Promise<SkillHistoryEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM skill_history 
      WHERE user_interest_id = ${userInterestId}
      ORDER BY changed_at ASC
    `;

    return result.map((entry) => ({
      id: entry.id,
      userInterestId: entry.user_interest_id,
      previousLevel: entry.previous_level,
      newLevel: entry.new_level,
      changedAt: entry.changed_at,
      retrospectiveId: entry.retrospective_id,
      notes: entry.notes,
    }));
  } catch (error) {
    console.error("Error getting skill history:", error);
    throw new Error("Failed to get skill history");
  }
}

// Cohort Stats Operations (Legacy - use cohort-operations.ts for new functionality)
export async function updateCohortStats(statsData: {
  ageRangeMin: number;
  ageRangeMax: number;
  interestCategory: string;
  intentLevel: CommitmentLevel;
  skillLevel: SkillLevel;
  userCount: number;
  percentileData: Record<string, unknown>;
}): Promise<CohortStats> {
  try {
    const result = await sql`
      INSERT INTO cohort_stats (age_range_min, age_range_max, interest_category, intent_level, skill_level, user_count, percentile_data)
      VALUES (${statsData.ageRangeMin}, ${statsData.ageRangeMax}, ${
      statsData.interestCategory
    }, ${statsData.intentLevel}, ${statsData.skillLevel}, ${
      statsData.userCount
    }, ${JSON.stringify(statsData.percentileData)})
      ON CONFLICT (age_range_min, age_range_max, interest_category, intent_level, skill_level)
      DO UPDATE SET 
        user_count = EXCLUDED.user_count,
        percentile_data = EXCLUDED.percentile_data,
        updated_at = NOW()
      RETURNING *
    `;

    const stats = result[0];
    return {
      id: stats.id,
      ageRangeMin: stats.age_range_min,
      ageRangeMax: stats.age_range_max,
      interestCategory: stats.interest_category,
      intentLevel: stats.intent_level as CommitmentLevel,
      skillLevel: stats.skill_level as SkillLevel,
      userCount: stats.user_count,
      percentileData: stats.percentile_data,
      updatedAt: stats.updated_at,
    };
  } catch (error) {
    console.error("Error updating cohort stats:", error);
    throw new Error("Failed to update cohort stats");
  }
}

export async function getCohortStats(
  ageRangeMin: number,
  ageRangeMax: number,
  interestCategory: string,
  intentLevel: CommitmentLevel
): Promise<CohortStats[]> {
  try {
    const result = await sql`
      SELECT * FROM cohort_stats 
      WHERE age_range_min = ${ageRangeMin} 
        AND age_range_max = ${ageRangeMax}
        AND interest_category = ${interestCategory}
        AND intent_level = ${intentLevel}
      ORDER BY skill_level ASC
    `;

    return result.map((stats) => ({
      id: stats.id,
      ageRangeMin: stats.age_range_min,
      ageRangeMax: stats.age_range_max,
      interestCategory: stats.interest_category,
      intentLevel: stats.intent_level as CommitmentLevel,
      skillLevel: stats.skill_level as SkillLevel,
      userCount: stats.user_count,
      percentileData: stats.percentile_data,
      updatedAt: stats.updated_at,
    }));
  } catch (error) {
    console.error("Error getting cohort stats:", error);
    throw new Error("Failed to get cohort stats");
  }
}

// Predefined Paths Operations
export async function getPredefinedPaths(
  interestCategory?: string
): Promise<PredefinedPath[]> {
  try {
    let query;
    if (interestCategory) {
      query = sql`
        SELECT * FROM predefined_paths 
        WHERE interest_category = ${interestCategory}
        ORDER BY path_name ASC
      `;
    } else {
      query = sql`
        SELECT * FROM predefined_paths 
        ORDER BY interest_category ASC, path_name ASC
      `;
    }

    const result = await query;

    return result.map((path) => ({
      id: path.id,
      interestCategory: path.interest_category,
      pathName: path.path_name,
      description: path.description,
      ageRangeMin: path.age_range_min,
      ageRangeMax: path.age_range_max,
      intentLevels: path.intent_levels as CommitmentLevel[],
      stages: path.stages,
      synergies: path.synergies,
      createdAt: path.created_at,
      updatedAt: path.updated_at,
    }));
  } catch (error) {
    console.error("Error getting predefined paths:", error);
    throw new Error("Failed to get predefined paths");
  }
}

export async function getPathsForUser(
  userId: string,
  interestCategory?: string
): Promise<PredefinedPath[]> {
  try {
    // Get user's age range and interests
    const userResult = await sql`
      SELECT age_range_min, age_range_max FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      throw new Error("User not found");
    }

    const { age_range_min, age_range_max } = userResult[0];

    let query;
    if (interestCategory) {
      query = sql`
        SELECT * FROM predefined_paths 
        WHERE interest_category = ${interestCategory}
          AND (age_range_min IS NULL OR age_range_min <= ${age_range_max})
          AND (age_range_max IS NULL OR age_range_max >= ${age_range_min})
        ORDER BY path_name ASC
      `;
    } else {
      query = sql`
        SELECT * FROM predefined_paths 
        WHERE (age_range_min IS NULL OR age_range_min <= ${age_range_max})
          AND (age_range_max IS NULL OR age_range_max >= ${age_range_min})
        ORDER BY interest_category ASC, path_name ASC
      `;
    }

    const result = await query;

    return result.map((path) => ({
      id: path.id,
      interestCategory: path.interest_category,
      pathName: path.path_name,
      description: path.description,
      ageRangeMin: path.age_range_min,
      ageRangeMax: path.age_range_max,
      intentLevels: path.intent_levels as CommitmentLevel[],
      stages: path.stages,
      synergies: path.synergies,
      createdAt: path.created_at,
      updatedAt: path.updated_at,
    }));
  } catch (error) {
    console.error("Error getting paths for user:", error);
    throw new Error("Failed to get paths for user");
  }
}

export async function getPathById(
  pathId: string
): Promise<PredefinedPath | null> {
  try {
    const result = await sql`
      SELECT * FROM predefined_paths WHERE id = ${pathId}
    `;

    if (result.length === 0) {
      return null;
    }

    const path = result[0];
    return {
      id: path.id,
      interestCategory: path.interest_category,
      pathName: path.path_name,
      description: path.description,
      ageRangeMin: path.age_range_min,
      ageRangeMax: path.age_range_max,
      intentLevels: path.intent_levels as CommitmentLevel[],
      stages: path.stages,
      synergies: path.synergies,
      createdAt: path.created_at,
      updatedAt: path.updated_at,
    };
  } catch (error) {
    console.error("Error getting path by ID:", error);
    throw new Error("Failed to get path");
  }
}

// User Path Progress Operations
export async function startUserPath(
  userId: string,
  pathId: string
): Promise<UserPathProgress> {
  try {
    const result = await sql`
      INSERT INTO user_path_progress (user_id, path_id, current_stage, stages_completed)
      VALUES (${userId}, ${pathId}, 0, '[]'::jsonb)
      ON CONFLICT (user_id, path_id) 
      DO UPDATE SET last_updated = NOW()
      RETURNING *
    `;

    const progress = result[0];
    return {
      id: progress.id,
      userId: progress.user_id,
      pathId: progress.path_id,
      currentStage: progress.current_stage,
      stagesCompleted: progress.stages_completed,
      startedAt: progress.started_at,
      lastUpdated: progress.last_updated,
    };
  } catch (error) {
    console.error("Error starting user path:", error);
    throw new Error("Failed to start user path");
  }
}

export async function updateUserPathProgress(
  userId: string,
  pathId: string,
  currentStage: number,
  stagesCompleted: number[]
): Promise<UserPathProgress> {
  try {
    const result = await sql`
      UPDATE user_path_progress 
      SET current_stage = ${currentStage}, 
          stages_completed = ${JSON.stringify(stagesCompleted)},
          last_updated = NOW()
      WHERE user_id = ${userId} AND path_id = ${pathId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error("User path progress not found");
    }

    const progress = result[0];
    return {
      id: progress.id,
      userId: progress.user_id,
      pathId: progress.path_id,
      currentStage: progress.current_stage,
      stagesCompleted: progress.stages_completed,
      startedAt: progress.started_at,
      lastUpdated: progress.last_updated,
    };
  } catch (error) {
    console.error("Error updating user path progress:", error);
    throw new Error("Failed to update user path progress");
  }
}

export async function getUserPathProgress(
  userId: string,
  pathId?: string
): Promise<UserPathProgress[]> {
  try {
    let query;
    if (pathId) {
      query = sql`
        SELECT * FROM user_path_progress 
        WHERE user_id = ${userId} AND path_id = ${pathId}
      `;
    } else {
      query = sql`
        SELECT * FROM user_path_progress 
        WHERE user_id = ${userId}
        ORDER BY last_updated DESC
      `;
    }

    const result = await query;

    return result.map((progress) => ({
      id: progress.id,
      userId: progress.user_id,
      pathId: progress.path_id,
      currentStage: progress.current_stage,
      stagesCompleted: progress.stages_completed,
      startedAt: progress.started_at,
      lastUpdated: progress.last_updated,
    }));
  } catch (error) {
    console.error("Error getting user path progress:", error);
    throw new Error("Failed to get user path progress");
  }
}

export async function getUserPathsWithProgress(
  userId: string
): Promise<Array<PredefinedPath & { progress?: UserPathProgress }>> {
  try {
    const result = await sql`
      SELECT 
        p.*,
        upp.id as progress_id,
        upp.current_stage,
        upp.stages_completed,
        upp.started_at,
        upp.last_updated
      FROM predefined_paths p
      LEFT JOIN user_path_progress upp ON p.id = upp.path_id AND upp.user_id = ${userId}
      JOIN users u ON u.id = ${userId}
      WHERE (p.age_range_min IS NULL OR p.age_range_min <= u.age_range_max)
        AND (p.age_range_max IS NULL OR p.age_range_max >= u.age_range_min)
      ORDER BY p.interest_category ASC, p.path_name ASC
    `;

    return result.map((row) => {
      const path: PredefinedPath = {
        id: row.id,
        interestCategory: row.interest_category,
        pathName: row.path_name,
        description: row.description,
        ageRangeMin: row.age_range_min,
        ageRangeMax: row.age_range_max,
        intentLevels: row.intent_levels as CommitmentLevel[],
        stages: row.stages,
        synergies: row.synergies,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      if (row.progress_id) {
        const progress: UserPathProgress = {
          id: row.progress_id,
          userId: userId,
          pathId: row.id,
          currentStage: row.current_stage,
          stagesCompleted: row.stages_completed,
          startedAt: row.started_at,
          lastUpdated: row.last_updated,
        };
        return { ...path, progress };
      }

      return path;
    });
  } catch (error) {
    console.error("Error getting user paths with progress:", error);
    throw new Error("Failed to get user paths with progress");
  }
}

// Simulation Scenario Operations
export async function createSimulationScenario(scenarioData: {
  userId: string;
  scenarioName: string;
  effortAllocation: Record<string, number>;
  forecastedResults: Record<string, unknown>;
  timeframeWeeks: number;
}): Promise<SimulationScenario> {
  try {
    const result = await sql`
      INSERT INTO simulation_scenarios (user_id, scenario_name, effort_allocation, forecasted_results, timeframe_weeks)
      VALUES (${scenarioData.userId}, ${
      scenarioData.scenarioName
    }, ${JSON.stringify(scenarioData.effortAllocation)}, ${JSON.stringify(
      scenarioData.forecastedResults
    )}, ${scenarioData.timeframeWeeks})
      RETURNING *
    `;

    const scenario = result[0];
    return {
      id: scenario.id,
      userId: scenario.user_id,
      scenarioName: scenario.scenario_name,
      effortAllocation: scenario.effort_allocation,
      forecastedResults: scenario.forecasted_results,
      timeframeWeeks: scenario.timeframe_weeks,
      createdAt: scenario.created_at,
      isConvertedToGoals: scenario.is_converted_to_goals,
    };
  } catch (error) {
    console.error("Error creating simulation scenario:", error);
    throw new Error("Failed to create simulation scenario");
  }
}

export async function getUserSimulationScenarios(
  userId: string
): Promise<SimulationScenario[]> {
  try {
    const result = await sql`
      SELECT * FROM simulation_scenarios 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.map((scenario) => ({
      id: scenario.id,
      userId: scenario.user_id,
      scenarioName: scenario.scenario_name,
      effortAllocation: scenario.effort_allocation,
      forecastedResults: scenario.forecasted_results,
      timeframeWeeks: scenario.timeframe_weeks,
      createdAt: scenario.created_at,
      isConvertedToGoals: scenario.is_converted_to_goals,
    }));
  } catch (error) {
    console.error("Error getting user simulation scenarios:", error);
    throw new Error("Failed to get user simulation scenarios");
  }
}
