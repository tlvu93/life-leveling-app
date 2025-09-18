import {
  UserProfile,
  Interest,
  Goal,
  Retrospective,
  SkillHistoryEntry,
  CohortStats,
  PredefinedPath,
  SimulationScenario,
  UserFilters,
  GoalFilters,
  InterestFilters,
  PaginationOptions,
  PaginatedResult,
  UserProgressSummary,
  InterestAnalytics,
  CohortComparison,
  SkillLevel,
  CommitmentLevel,
  GoalStatus,
  RetrospectiveType,
} from "@/types";
import {
  executeWithErrorHandling,
  executePaginatedQuery,
  findRecordById,
  findRecordsByField,
  countRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./database-helpers";
import { sql } from "./db";

// User Data Access Layer
export class UserDAL {
  static async findById(id: string): Promise<UserProfile | null> {
    return executeWithErrorHandling(async () => {
      const user = await findRecordById<any>("users", id);
      if (!user) return null;

      const interests = await InterestDAL.findByUserId(id);

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
    }, "UserDAL.findById");
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    return executeWithErrorHandling(async () => {
      const users = await findRecordsByField<any>("users", "email", email);
      if (users.length === 0) return null;

      return this.findById(users[0].id);
    }, "UserDAL.findByEmail");
  }

  static async create(userData: {
    email: string;
    passwordHash: string;
    ageRangeMin: number;
    ageRangeMax: number;
    familyModeEnabled?: boolean;
  }): Promise<UserProfile> {
    return executeWithErrorHandling(async () => {
      const result = await createRecord("users", {
        email: userData.email,
        password_hash: userData.passwordHash,
        age_range_min: userData.ageRangeMin,
        age_range_max: userData.ageRangeMax,
        family_mode_enabled: userData.familyModeEnabled || false,
      });

      if (!result.success || !result.data) {
        throw new Error("Failed to create user");
      }

      return this.findById((result.data as any).id) as Promise<UserProfile>;
    }, "UserDAL.create");
  }

  static async updateLastActive(userId: string): Promise<void> {
    return executeWithErrorHandling(async () => {
      await updateRecord("users", userId, {
        last_active: new Date(),
      });
    }, "UserDAL.updateLastActive");
  }

  static async completeOnboarding(userId: string): Promise<void> {
    return executeWithErrorHandling(async () => {
      await updateRecord("users", userId, {
        onboarding_completed: true,
      });
    }, "UserDAL.completeOnboarding");
  }

  static async findWithFilters(
    filters: UserFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<UserProfile>> {
    return executeWithErrorHandling(async () => {
      let baseQuery = "SELECT * FROM users";
      const params: any[] = [];
      const whereConditions: string[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.ageRangeMin !== undefined) {
        whereConditions.push(`age_range_min >= $${paramIndex}`);
        params.push(filters.ageRangeMin);
        paramIndex++;
      }

      if (filters.ageRangeMax !== undefined) {
        whereConditions.push(`age_range_max <= $${paramIndex}`);
        params.push(filters.ageRangeMax);
        paramIndex++;
      }

      if (filters.familyModeEnabled !== undefined) {
        whereConditions.push(`family_mode_enabled = $${paramIndex}`);
        params.push(filters.familyModeEnabled);
        paramIndex++;
      }

      if (filters.onboardingCompleted !== undefined) {
        whereConditions.push(`onboarding_completed = $${paramIndex}`);
        params.push(filters.onboardingCompleted);
        paramIndex++;
      }

      if (filters.lastActiveAfter) {
        whereConditions.push(`last_active > $${paramIndex}`);
        params.push(filters.lastActiveAfter);
        paramIndex++;
      }

      if (whereConditions.length > 0) {
        baseQuery += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      const result = await executePaginatedQuery<any>(
        baseQuery,
        params,
        pagination
      );

      // Transform database records to UserProfile objects
      const users = await Promise.all(
        result.data.map(async (user) => {
          const interests = await InterestDAL.findByUserId(user.id);
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
        })
      );

      return {
        ...result,
        data: users,
      };
    }, "UserDAL.findWithFilters");
  }

  static async getProgressSummary(
    userId: string
  ): Promise<UserProgressSummary> {
    return executeWithErrorHandling(async () => {
      // Get user interests
      const interests = await InterestDAL.findByUserId(userId);

      // Get goals
      const activeGoals = (await GoalDAL.findByUserId(userId, {
        status: GoalStatus.ACTIVE,
      })) as Goal[];
      const completedGoals = (await GoalDAL.findByUserId(userId, {
        status: GoalStatus.COMPLETED,
      })) as Goal[];

      // Get last retrospective
      const retrospectives = await RetrospectiveDAL.findByUserId(
        userId,
        {},
        { page: 1, limit: 1, sortBy: "completed_at", sortOrder: "DESC" }
      );
      const lastRetrospective = retrospectives.data[0]?.completedAt;

      // Get skill improvements from history
      const skillImprovements = await sql`
        SELECT 
          ui.category,
          sh.previous_level,
          sh.new_level,
          sh.changed_at
        FROM skill_history sh
        JOIN user_interests ui ON sh.user_interest_id = ui.id
        WHERE ui.user_id = ${userId}
          AND sh.previous_level < sh.new_level
        ORDER BY sh.changed_at DESC
        LIMIT 10
      `;

      const averageSkillLevel =
        interests.length > 0
          ? interests.reduce(
              (sum, interest) => sum + interest.currentLevel,
              0
            ) / interests.length
          : 0;

      return {
        userId,
        totalInterests: interests.length,
        averageSkillLevel: Math.round(averageSkillLevel * 100) / 100,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        lastRetrospective,
        skillImprovements: skillImprovements.map((improvement) => ({
          category: improvement.category,
          previousLevel: improvement.previous_level as SkillLevel,
          currentLevel: improvement.new_level as SkillLevel,
          improvementDate: improvement.changed_at,
        })),
      };
    }, "UserDAL.getProgressSummary");
  }
}

// Interest Data Access Layer
export class InterestDAL {
  static async findByUserId(userId: string): Promise<Interest[]> {
    return executeWithErrorHandling(async () => {
      const interests = await findRecordsByField(
        "user_interests",
        "user_id",
        userId,
        ["*"],
        "created_at ASC"
      );

      return interests.map((interest: any) => ({
        id: interest.id,
        userId: interest.user_id,
        category: interest.category,
        subcategory: interest.subcategory,
        currentLevel: interest.current_level as SkillLevel,
        intentLevel: interest.intent_level as CommitmentLevel,
        createdAt: interest.created_at,
        updatedAt: interest.updated_at,
      }));
    }, "InterestDAL.findByUserId");
  }

  static async create(interestData: {
    userId: string;
    category: string;
    subcategory?: string;
    currentLevel: SkillLevel;
    intentLevel: CommitmentLevel;
  }): Promise<Interest> {
    return executeWithErrorHandling(async () => {
      const result = await createRecord("user_interests", {
        user_id: interestData.userId,
        category: interestData.category,
        subcategory: interestData.subcategory || null,
        current_level: interestData.currentLevel,
        intent_level: interestData.intentLevel,
      });

      if (!result.success || !result.data) {
        throw new Error("Failed to create interest");
      }

      const interest = result.data as any;
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
    }, "InterestDAL.create");
  }

  static async updateLevel(
    interestId: string,
    newLevel: SkillLevel,
    retrospectiveId?: string
  ): Promise<Interest> {
    return executeWithErrorHandling(async () => {
      // Get current level for history tracking
      const currentInterest = await findRecordById(
        "user_interests",
        interestId
      );
      if (!currentInterest) {
        throw new Error("Interest not found");
      }

      const previousLevel = (currentInterest as any).current_level;

      // Update the interest level
      const result = await updateRecord("user_interests", interestId, {
        current_level: newLevel,
        updated_at: new Date(),
      });

      if (!result.success || !result.data) {
        throw new Error("Failed to update interest level");
      }

      // Record the change in skill history
      await createRecord("skill_history", {
        user_interest_id: interestId,
        previous_level: previousLevel,
        new_level: newLevel,
        retrospective_id: retrospectiveId || null,
      });

      const interest = result.data as any;
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
    }, "InterestDAL.updateLevel");
  }

  static async getAnalytics(category?: string): Promise<InterestAnalytics[]> {
    return executeWithErrorHandling(async () => {
      let results;

      if (category) {
        results = await sql`
          SELECT 
            category,
            COUNT(*) as total_users,
            AVG(current_level) as average_level,
            current_level,
            intent_level,
            COUNT(*) as level_count
          FROM user_interests
          WHERE category = ${category}
          GROUP BY category, current_level, intent_level
          ORDER BY category, current_level
        `;
      } else {
        results = await sql`
          SELECT 
            category,
            COUNT(*) as total_users,
            AVG(current_level) as average_level,
            current_level,
            intent_level,
            COUNT(*) as level_count
          FROM user_interests
          GROUP BY category, current_level, intent_level
          ORDER BY category, current_level
        `;
      }

      // Group results by category
      const analyticsMap = new Map<string, any>();

      for (const row of results) {
        const cat = row.category;
        if (!analyticsMap.has(cat)) {
          analyticsMap.set(cat, {
            category: cat,
            totalUsers: 0,
            averageLevel: 0,
            levelDistribution: [],
            intentDistribution: {},
          });
        }

        const analytics = analyticsMap.get(cat);
        analytics.totalUsers += row.level_count;
        analytics.averageLevel = row.average_level;

        // Add to level distribution
        analytics.levelDistribution.push({
          skillLevel: row.current_level as SkillLevel,
          count: row.level_count,
          percentage: 0, // Will calculate after grouping
        });

        // Add to intent distribution
        if (!analytics.intentDistribution[row.intent_level]) {
          analytics.intentDistribution[row.intent_level] = 0;
        }
        analytics.intentDistribution[row.intent_level] += row.level_count;
      }

      // Calculate percentages
      const analyticsArray = Array.from(analyticsMap.values());
      for (const analytics of analyticsArray) {
        for (const levelDist of analytics.levelDistribution) {
          levelDist.percentage = Math.round(
            (levelDist.count / analytics.totalUsers) * 100
          );
        }
      }

      return analyticsArray;
    }, "InterestDAL.getAnalytics");
  }
}

// Goal Data Access Layer
export class GoalDAL {
  static async findByUserId(
    userId: string,
    filters: GoalFilters = {},
    pagination?: PaginationOptions
  ): Promise<Goal[] | PaginatedResult<Goal>> {
    return executeWithErrorHandling(async () => {
      let baseQuery = "SELECT * FROM goals WHERE user_id = $1";
      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters.status) {
        baseQuery += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.goalType) {
        baseQuery += ` AND goal_type = $${paramIndex}`;
        params.push(filters.goalType);
        paramIndex++;
      }

      if (filters.timeframe) {
        baseQuery += ` AND timeframe = $${paramIndex}`;
        params.push(filters.timeframe);
        paramIndex++;
      }

      if (filters.interestCategory) {
        baseQuery += ` AND interest_category = $${paramIndex}`;
        params.push(filters.interestCategory);
        paramIndex++;
      }

      if (filters.createdAfter) {
        baseQuery += ` AND created_at > $${paramIndex}`;
        params.push(filters.createdAfter);
        paramIndex++;
      }

      if (filters.targetDateBefore) {
        baseQuery += ` AND target_date < $${paramIndex}`;
        params.push(filters.targetDateBefore);
        paramIndex++;
      }

      const transformGoal = (goal: any): Goal => ({
        id: goal.id,
        userId: goal.user_id,
        interestCategory: goal.interest_category,
        goalType: goal.goal_type,
        title: goal.title,
        description: goal.description,
        targetLevel: goal.target_level,
        timeframe: goal.timeframe,
        status: goal.status,
        createdAt: goal.created_at,
        targetDate: goal.target_date,
        completedAt: goal.completed_at,
      });

      if (pagination) {
        const result = await executePaginatedQuery<any>(
          baseQuery,
          params,
          pagination
        );
        return {
          ...result,
          data: result.data.map(transformGoal),
        };
      } else {
        baseQuery += " ORDER BY created_at DESC";
        const goals = await sql(baseQuery, ...params);
        return goals.map(transformGoal);
      }
    }, "GoalDAL.findByUserId");
  }

  static async create(goalData: {
    userId: string;
    interestCategory: string;
    goalType: string;
    title: string;
    description: string;
    targetLevel?: SkillLevel;
    timeframe: string;
    targetDate?: Date;
  }): Promise<Goal> {
    return executeWithErrorHandling(async () => {
      const result = await createRecord("goals", {
        user_id: goalData.userId,
        interest_category: goalData.interestCategory,
        goal_type: goalData.goalType,
        title: goalData.title,
        description: goalData.description,
        target_level: goalData.targetLevel || null,
        timeframe: goalData.timeframe,
        target_date: goalData.targetDate || null,
      });

      if (!result.success || !result.data) {
        throw new Error("Failed to create goal");
      }

      const goal = result.data;
      return {
        id: goal.id,
        userId: goal.user_id,
        interestCategory: goal.interest_category,
        goalType: goal.goal_type,
        title: goal.title,
        description: goal.description,
        targetLevel: goal.target_level,
        timeframe: goal.timeframe,
        status: goal.status,
        createdAt: goal.created_at,
        targetDate: goal.target_date,
        completedAt: goal.completed_at,
      };
    }, "GoalDAL.create");
  }

  static async updateStatus(goalId: string, status: GoalStatus): Promise<Goal> {
    return executeWithErrorHandling(async () => {
      const updateData: any = { status };
      if (status === GoalStatus.COMPLETED) {
        updateData.completed_at = new Date();
      }

      const result = await updateRecord("goals", goalId, updateData);

      if (!result.success || !result.data) {
        throw new Error("Failed to update goal status");
      }

      const goal = result.data;
      return {
        id: goal.id,
        userId: goal.user_id,
        interestCategory: goal.interest_category,
        goalType: goal.goal_type,
        title: goal.title,
        description: goal.description,
        targetLevel: goal.target_level,
        timeframe: goal.timeframe,
        status: goal.status,
        createdAt: goal.created_at,
        targetDate: goal.target_date,
        completedAt: goal.completed_at,
      };
    }, "GoalDAL.updateStatus");
  }
}

// Retrospective Data Access Layer
export class RetrospectiveDAL {
  static async findByUserId(
    userId: string,
    filters: { type?: RetrospectiveType } = {},
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Retrospective>> {
    return executeWithErrorHandling(async () => {
      let baseQuery = "SELECT * FROM retrospectives WHERE user_id = $1";
      const params: any[] = [userId];

      if (filters.type) {
        baseQuery += " AND type = $2";
        params.push(filters.type);
      }

      const result = await executePaginatedQuery<any>(
        baseQuery,
        params,
        pagination
      );

      return {
        ...result,
        data: result.data.map((retrospective) => ({
          id: retrospective.id,
          userId: retrospective.user_id,
          type: retrospective.type as RetrospectiveType,
          completedAt: retrospective.completed_at,
          insights: retrospective.insights,
          skillUpdates: retrospective.skill_updates,
          goalsReviewed: retrospective.goals_reviewed,
        })),
      };
    }, "RetrospectiveDAL.findByUserId");
  }

  static async create(retrospectiveData: {
    userId: string;
    type: RetrospectiveType;
    insights?: Record<string, any>;
    skillUpdates?: Record<string, any>;
    goalsReviewed?: Record<string, unknown>;
  }): Promise<Retrospective> {
    return executeWithErrorHandling(async () => {
      const result = await createRecord("retrospectives", {
        user_id: retrospectiveData.userId,
        type: retrospectiveData.type,
        insights: JSON.stringify(retrospectiveData.insights || {}),
        skill_updates: JSON.stringify(retrospectiveData.skillUpdates || {}),
        goals_reviewed: JSON.stringify(retrospectiveData.goalsReviewed || {}),
      });

      if (!result.success || !result.data) {
        throw new Error("Failed to create retrospective");
      }

      const retrospective = result.data;
      return {
        id: retrospective.id,
        userId: retrospective.user_id,
        type: retrospective.type as RetrospectiveType,
        completedAt: retrospective.completed_at,
        insights: retrospective.insights,
        skillUpdates: retrospective.skill_updates,
        goalsReviewed: retrospective.goals_reviewed,
      };
    }, "RetrospectiveDAL.create");
  }
}

// Cohort Stats Data Access Layer
export class CohortStatsDAL {
  static async getCohortComparison(
    userId: string,
    category: string
  ): Promise<CohortComparison | null> {
    return executeWithErrorHandling(async () => {
      // Get user's interest in this category
      const userInterest = await sql`
        SELECT ui.*, u.age_range_min, u.age_range_max
        FROM user_interests ui
        JOIN users u ON ui.user_id = u.id
        WHERE ui.user_id = ${userId} AND ui.category = ${category}
      `;

      if (userInterest.length === 0) {
        return null;
      }

      const interest = userInterest[0];

      // Get cohort stats
      const cohortStats = await sql`
        SELECT *
        FROM cohort_stats
        WHERE age_range_min = ${interest.age_range_min}
          AND age_range_max = ${interest.age_range_max}
          AND interest_category = ${category}
          AND intent_level = ${interest.intent_level}
        ORDER BY skill_level ASC
      `;

      if (cohortStats.length === 0) {
        return null;
      }

      // Calculate user's percentile
      const userLevel = interest.current_level;
      const totalUsers = cohortStats.reduce(
        (sum, stat) => sum + stat.user_count,
        0
      );
      let usersBelow = 0;

      for (const stat of cohortStats) {
        if (stat.skill_level < userLevel) {
          usersBelow += stat.user_count;
        } else if (stat.skill_level === userLevel) {
          usersBelow += stat.user_count / 2; // Assume user is in middle of their level
          break;
        }
      }

      const percentile = Math.round((usersBelow / totalUsers) * 100);

      // Generate encouraging message
      let encouragingMessage = "";
      if (percentile >= 90) {
        encouragingMessage = `Amazing! You're in the top 10% of ${
          interest.intent_level
        } ${category.toLowerCase()} enthusiasts in your age group!`;
      } else if (percentile >= 75) {
        encouragingMessage = `Great work! You're in the top 25% of your peers in ${category.toLowerCase()}!`;
      } else if (percentile >= 50) {
        encouragingMessage = `You're doing well! You're above average compared to your peers in ${category.toLowerCase()}!`;
      } else {
        encouragingMessage = `Keep going! Every expert was once a beginner. You're on a great path in ${category.toLowerCase()}!`;
      }

      return {
        userId,
        category,
        userLevel: userLevel as SkillLevel,
        cohortStats: {
          ageRangeMin: interest.age_range_min,
          ageRangeMax: interest.age_range_max,
          intentLevel: interest.intent_level as CommitmentLevel,
          totalUsers,
          averageLevel:
            cohortStats.reduce(
              (sum, stat) => sum + stat.skill_level * stat.user_count,
              0
            ) / totalUsers,
          percentiles: cohortStats.reduce((acc, stat) => {
            acc[stat.skill_level] = stat.percentile_data;
            return acc;
          }, {} as Record<string, unknown>),
        },
        userPercentile: percentile,
        encouragingMessage,
      };
    }, "CohortStatsDAL.getCohortComparison");
  }
}
