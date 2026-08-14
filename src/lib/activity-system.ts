/**
 * Activity-based Life Leveling System
 * Tracks recent effort and goal completion instead of static skill levels
 */

/**
 * Every activity kind that earns points. Derived from `ACTIVITY_POINTS` below
 * so the two can never drift apart — the hand-written union that used to live
 * here was missing `daily_bonus`.
 */
export type ActivityType = keyof typeof ACTIVITY_POINTS;

export interface ActivityEntry {
  id: string;
  userId: string;
  category: string; // Interest category (Music, Sports, etc.)
  activityType: ActivityType;
  points: number;
  description: string;
  completedAt: Date;
  goalId?: string; // Reference to completed goal
}

export interface CategoryActivity {
  category: string;
  totalPoints: number;
  recentPoints: number; // Points from last 2 weeks
  weeklyPoints: number; // Points from last week
  activities: ActivityEntry[];
  level: number; // Calculated level based on recent activity
  streak: number; // Current streak in days
}

export interface ActivityMatrixData {
  categories: CategoryActivity[];
  totalRecentPoints: number;
  totalActivities: number;
  averageActivity: number;
  lastUpdated: Date;
}

/**
 * Point values for different activities
 */
export const ACTIVITY_POINTS = {
  goal_completed: 100,
  practice_session: 25,
  milestone_reached: 50,
  streak_bonus: 10,
  daily_bonus: 5,
} as const;

/**
 * Calculate activity level based on recent points (last 2 weeks)
 */
export function calculateActivityLevel(recentPoints: number): number {
  if (recentPoints >= 500) return 4; // Very Active
  if (recentPoints >= 300) return 3; // Active
  if (recentPoints >= 150) return 2; // Moderate
  if (recentPoints >= 50) return 1; // Light Activity
  return 0; // No Recent Activity
}

/**
 * Get activity level label
 */
export function getActivityLevelLabel(level: number): string {
  const labels = [
    "No Recent Activity",
    "Light Activity",
    "Moderate Activity",
    "Active",
    "Very Active",
  ];
  return labels[level] || "Unknown";
}

/**
 * Get activity level description
 */
export function getActivityLevelDescription(level: number): string {
  switch (level) {
    case 0:
      return "Time to get back into action! Set a small goal to get started.";
    case 1:
      return "Good start! Keep building momentum with regular practice.";
    case 2:
      return "Nice progress! You're developing a good routine.";
    case 3:
      return "Great work! You're consistently putting in effort.";
    case 4:
      return "Amazing dedication! You're crushing your goals!";
    default:
      return "Keep up the great work!";
  }
}

/**
 * Calculate activity points for the last N days
 */
export function calculateRecentPoints(
  activities: ActivityEntry[],
  days: number = 14
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return activities
    .filter((activity) => activity.completedAt >= cutoffDate)
    .reduce((total, activity) => total + activity.points, 0);
}

/**
 * Calculate current streak for a category
 */
export function calculateStreak(activities: ActivityEntry[]): number {
  if (activities.length === 0) return 0;

  // Sort activities by date (most recent first)
  const sortedActivities = activities.sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if there's activity today or yesterday
  const mostRecentActivity = sortedActivities[0];
  const mostRecentDate = new Date(mostRecentActivity.completedAt);
  mostRecentDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) {
    return 0; // Streak broken if no activity yesterday or today
  }

  // Count consecutive days with activity
  const activityDates = new Set(
    sortedActivities.map((activity) => {
      const date = new Date(activity.completedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const checkDate = new Date(mostRecentDate);
  while (activityDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Generate sample activity data for demo/testing
 */
export function generateSampleActivityData(): ActivityMatrixData {
  const categories = [
    "Music",
    "Sports",
    "Math",
    "Communication",
    "Creativity",
    "Technical",
  ];
  const now = new Date();

  const categoryActivities: CategoryActivity[] = categories.map((category) => {
    // Generate random activities for the last 2 weeks
    const activities: ActivityEntry[] = [];
    const numActivities = Math.floor(Math.random() * 10) + 2; // 2-12 activities

    for (let i = 0; i < numActivities; i++) {
      const daysAgo = Math.floor(Math.random() * 14); // Last 14 days
      const activityDate = new Date(now);
      activityDate.setDate(activityDate.getDate() - daysAgo);

      const activityTypes: (keyof typeof ACTIVITY_POINTS)[] = [
        "goal_completed",
        "practice_session",
        "milestone_reached",
        "streak_bonus",
      ];
      const activityType =
        activityTypes[Math.floor(Math.random() * activityTypes.length)];

      activities.push({
        id: `activity-${category}-${i}`,
        userId: "demo-user",
        category,
        activityType,
        points: ACTIVITY_POINTS[activityType],
        description: getActivityDescription(category, activityType),
        completedAt: activityDate,
      });
    }

    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    const recentPoints = calculateRecentPoints(activities, 14);
    const weeklyPoints = calculateRecentPoints(activities, 7);
    const level = calculateActivityLevel(recentPoints);
    const streak = calculateStreak(activities);

    return {
      category,
      totalPoints,
      recentPoints,
      weeklyPoints,
      activities,
      level,
      streak,
    };
  });

  const totalRecentPoints = categoryActivities.reduce(
    (sum, cat) => sum + cat.recentPoints,
    0
  );
  const totalActivities = categoryActivities.reduce(
    (sum, cat) => sum + cat.activities.length,
    0
  );
  const averageActivity = totalRecentPoints / categoryActivities.length;

  return {
    categories: categoryActivities,
    totalRecentPoints,
    totalActivities,
    averageActivity,
    lastUpdated: now,
  };
}

/**
 * Get a description for an activity
 */
function getActivityDescription(
  category: string,
  activityType: ActivityType
): string {
  const descriptions: Partial<
    Record<ActivityType, Record<string, string | undefined>>
  > = {
    goal_completed: {
      Music: "Completed practice goal",
      Sports: "Finished workout routine",
      Math: "Solved problem set",
      Communication: "Gave presentation",
      Creativity: "Finished art project",
      Technical: "Built new feature",
    },
    practice_session: {
      Music: "Practice session",
      Sports: "Training session",
      Math: "Study session",
      Communication: "Speaking practice",
      Creativity: "Creative work",
      Technical: "Coding session",
    },
    milestone_reached: {
      Music: "Learned new song",
      Sports: "Personal best",
      Math: "Mastered concept",
      Communication: "Confident presentation",
      Creativity: "Portfolio piece",
      Technical: "Deployed project",
    },
    streak_bonus: {
      Music: "Daily practice streak",
      Sports: "Workout streak",
      Math: "Study streak",
      Communication: "Practice streak",
      Creativity: "Creative streak",
      Technical: "Coding streak",
    },
    daily_bonus: {
      Music: "Showed up today",
      Sports: "Showed up today",
      Math: "Showed up today",
      Communication: "Showed up today",
      Creativity: "Showed up today",
      Technical: "Showed up today",
    },
  };

  return (
    descriptions[activityType]?.[category] ??
    `${activityType.replaceAll("_", " ")} in ${category}`
  );
}

/**
 * Convert activity data to radar chart format
 */
export function activityToRadarData(activityData: ActivityMatrixData) {
  return activityData.categories.map((category, index) => ({
    skill: category.category,
    value: category.level,
    maxValue: 4,
    color: getActivityColor(category.level, index),
    points: category.recentPoints,
    streak: category.streak,
  }));
}

/**
 * Get color for activity level
 */
function getActivityColor(level: number, index: number): string {
  const baseColors = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280", // Gray
  ];

  const baseColor = baseColors[index % baseColors.length];

  // Adjust opacity based on activity level
  const opacity = level === 0 ? 0.2 : 0.4 + (level / 4) * 0.6;

  return `${baseColor}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/**
 * Add activity entry
 */
export function addActivity(
  currentData: ActivityMatrixData,
  category: string,
  activityType: keyof typeof ACTIVITY_POINTS,
  description?: string
): ActivityMatrixData {
  const newActivity: ActivityEntry = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: "current-user",
    category,
    activityType,
    points: ACTIVITY_POINTS[activityType],
    description: description || getActivityDescription(category, activityType),
    completedAt: new Date(),
  };

  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.category === category) {
      const updatedActivities = [...cat.activities, newActivity];
      const totalPoints = cat.totalPoints + newActivity.points;
      const recentPoints = calculateRecentPoints(updatedActivities, 14);
      const weeklyPoints = calculateRecentPoints(updatedActivities, 7);
      const level = calculateActivityLevel(recentPoints);
      const streak = calculateStreak(updatedActivities);

      return {
        ...cat,
        activities: updatedActivities,
        totalPoints,
        recentPoints,
        weeklyPoints,
        level,
        streak,
      };
    }
    return cat;
  });

  const totalRecentPoints = updatedCategories.reduce(
    (sum, cat) => sum + cat.recentPoints,
    0
  );
  const totalActivities = updatedCategories.reduce(
    (sum, cat) => sum + cat.activities.length,
    0
  );
  const averageActivity = totalRecentPoints / updatedCategories.length;

  return {
    categories: updatedCategories,
    totalRecentPoints,
    totalActivities,
    averageActivity,
    lastUpdated: new Date(),
  };
}
