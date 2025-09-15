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
    const result = await sql`
      SELECT id, email, age_range_min, age_range_max, family_mode_enabled, onboarding_completed, created_at, last_active 
      FROM users WHERE email = ${email}
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    return getUserById(user.id);
  } catch (error) {
    console.error("Error getting user by email:", error);
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
      RETURNING *
    `;

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
    // Get current level for history tracking
    const currentResult = await sql`
      SELECT current_level FROM user_interests WHERE id = ${interestId}
    `;

    if (currentResult.length === 0) {
      throw new Error("Interest not found");
    }

    const previousLevel = currentResult[0].current_level;

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

// Retrospective Operations
export async function createRetrospective(retrospectiveData: {
  userId: string;
  type: RetrospectiveType;
  insights?: Record<string, any>;
  skillUpdates?: Record<string, any>;
  goalsReviewed?: Record<string, any>;
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

// Cohort Stats Operations
export async function updateCohortStats(statsData: {
  ageRangeMin: number;
  ageRangeMax: number;
  interestCategory: string;
  intentLevel: CommitmentLevel;
  skillLevel: SkillLevel;
  userCount: number;
  percentileData: Record<string, any>;
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
