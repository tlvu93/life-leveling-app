import {
  Interest,
  RadarChartData,
  LifeStatMatrixData,
  SkillHistoryEntry,
} from "@/types";

/**
 * Converts user interests to radar chart data format
 */
export function interestsToRadarData(interests: Interest[]): RadarChartData[] {
  return interests.map((interest, index) => ({
    skill: interest.category,
    value: interest.currentLevel,
    maxValue: 4, // Maximum skill level (Expert)
    color: getSkillColor(interest.currentLevel, index),
  }));
}

/**
 * Creates LifeStatMatrixData from current interests and optional historical data
 */
export function createLifeStatMatrixData(
  interests: Interest[],
  historicalData?: Array<{
    date: Date;
    interests: Interest[];
  }>
): LifeStatMatrixData {
  const current = interestsToRadarData(interests);

  const historical = historicalData?.map((entry) => ({
    date: entry.date,
    data: interestsToRadarData(entry.interests),
  }));

  return {
    current,
    historical,
  };
}

/**
 * Converts skill history entries to historical radar data
 */
export function skillHistoryToRadarData(
  currentInterests: Interest[],
  skillHistory: SkillHistoryEntry[]
): Array<{
  date: Date;
  data: RadarChartData[];
}> {
  // Group skill history by date
  const historyByDate = new Map<string, Map<string, number>>();

  skillHistory.forEach((entry) => {
    const dateKey = entry.changedAt.toISOString().split("T")[0]; // Group by date

    if (!historyByDate.has(dateKey)) {
      historyByDate.set(dateKey, new Map());
    }

    // Find the interest category for this skill history entry
    const interest = currentInterests.find(
      (i) => i.id === entry.userInterestId
    );
    if (interest) {
      historyByDate.get(dateKey)!.set(interest.category, entry.newLevel);
    }
  });

  // Convert to radar data format
  return Array.from(historyByDate.entries())
    .map(([dateStr, skillLevels]) => ({
      date: new Date(dateStr),
      data: currentInterests.map((interest, index) => ({
        skill: interest.category,
        value: skillLevels.get(interest.category) || interest.currentLevel,
        maxValue: 4,
        color: getSkillColor(
          skillLevels.get(interest.category) || interest.currentLevel,
          index
        ),
      })),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Gets a color for a skill based on its level and index
 */
export function getSkillColor(level: number, index: number): string {
  // Base colors for different skills (using a pleasant palette)
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

  // Adjust opacity/brightness based on skill level
  const opacity = 0.4 + (level / 4) * 0.6; // 40% to 100% opacity

  return `${baseColor}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/**
 * Calculates the average skill level across all interests
 */
export function calculateAverageSkillLevel(interests: Interest[]): number {
  if (interests.length === 0) return 0;

  const total = interests.reduce(
    (sum, interest) => sum + interest.currentLevel,
    0
  );
  return Math.round((total / interests.length) * 10) / 10; // Round to 1 decimal place
}

/**
 * Gets skill level distribution for analytics
 */
export function getSkillLevelDistribution(
  interests: Interest[]
): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  interests.forEach((interest) => {
    distribution[interest.currentLevel]++;
  });

  return distribution;
}

/**
 * Finds the most improved skills based on historical data
 */
export function findMostImprovedSkills(
  currentInterests: Interest[],
  skillHistory: SkillHistoryEntry[],
  timeframe: "week" | "month" | "year" = "month"
): Array<{
  skill: string;
  improvement: number;
  previousLevel: number;
  currentLevel: number;
}> {
  const now = new Date();
  const timeframeMs = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  }[timeframe];

  const cutoffDate = new Date(now.getTime() - timeframeMs);

  // Get the earliest level for each skill within the timeframe
  const skillImprovements = new Map<
    string,
    { previous: number; current: number }
  >();

  currentInterests.forEach((interest) => {
    const relevantHistory = skillHistory
      .filter(
        (entry) =>
          entry.userInterestId === interest.id && entry.changedAt >= cutoffDate
      )
      .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

    if (relevantHistory.length > 0) {
      const earliest = relevantHistory[0];
      skillImprovements.set(interest.category, {
        previous: earliest.previousLevel || earliest.newLevel,
        current: interest.currentLevel,
      });
    }
  });

  return Array.from(skillImprovements.entries())
    .map(([skill, levels]) => ({
      skill,
      improvement: levels.current - levels.previous,
      previousLevel: levels.previous,
      currentLevel: levels.current,
    }))
    .filter((item) => item.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement);
}

/**
 * Generates sample data for testing and demos
 */
export function generateSampleLifeStatData(): LifeStatMatrixData {
  const sampleSkills = [
    "Music",
    "Sports",
    "Math",
    "Communication",
    "Creativity",
    "Technical",
  ];

  const current: RadarChartData[] = sampleSkills.map((skill, index) => ({
    skill,
    value: Math.floor(Math.random() * 4) + 1, // Random level 1-4
    maxValue: 4,
    color: getSkillColor(Math.floor(Math.random() * 4) + 1, index),
  }));

  // Generate some historical data (3 months ago)
  const historical = [
    {
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      data: sampleSkills.map((skill, index) => ({
        skill,
        value: Math.max(
          1,
          current[index].value - Math.floor(Math.random() * 2)
        ), // Slightly lower historical values
        maxValue: 4,
        color: getSkillColor(
          Math.max(1, current[index].value - Math.floor(Math.random() * 2)),
          index
        ),
      })),
    },
  ];

  return { current, historical };
}

/**
 * Validates radar chart data
 */
export function validateRadarChartData(data: RadarChartData[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  return data.every(
    (item) =>
      typeof item.skill === "string" &&
      typeof item.value === "number" &&
      typeof item.maxValue === "number" &&
      item.value >= 0 &&
      item.value <= item.maxValue
  );
}

/**
 * Formats skill level for display
 */
export function formatSkillLevel(level: number): string {
  const levels = ["", "Novice", "Intermediate", "Advanced", "Expert"];
  return levels[level] || "Unknown";
}

/**
 * Gets a descriptive message for skill level
 */
export function getSkillLevelDescription(level: number): string {
  switch (level) {
    case 1:
      return "Just getting started - keep exploring!";
    case 2:
      return "Making good progress - you're building solid foundations!";
    case 3:
      return "Really developing your skills - great work!";
    case 4:
      return "Excellent mastery - you're becoming an expert!";
    default:
      return "Keep learning and growing!";
  }
}
