// Core enums
export enum SkillLevel {
  NOVICE = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
}

export enum CommitmentLevel {
  CASUAL = "casual",
  AVERAGE = "average",
  INVESTED = "invested",
  COMPETITIVE = "competitive",
}

export enum GoalType {
  SKILL_INCREASE = "skill_increase",
  PROJECT_COMPLETION = "project_completion",
  BROAD_PROMISE = "broad_promise",
}

export enum Timeframe {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  CANCELLED = "cancelled",
}

export enum RetrospectiveType {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

// Core interfaces
export interface AgeRange {
  min: number;
  max: number;
}

export interface UserProfile {
  id: string;
  email: string;
  ageRangeMin: number;
  ageRangeMax: number;
  interests: Interest[];
  familyModeEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  lastActive: Date;
}

export interface Interest {
  id: string;
  userId: string;
  category: string;
  subcategory?: string;
  currentLevel: SkillLevel;
  intentLevel: CommitmentLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillHistoryEntry {
  id: string;
  userInterestId: string;
  previousLevel?: number;
  newLevel: number;
  changedAt: Date;
  retrospectiveId?: string;
  notes?: string;
}

export interface Goal {
  id: string;
  userId: string;
  interestCategory: string;
  goalType: GoalType;
  title: string;
  description: string;
  targetLevel?: SkillLevel;
  timeframe: Timeframe;
  status: GoalStatus;
  createdAt: Date;
  targetDate?: Date;
  completedAt?: Date;
}

export interface Retrospective {
  id: string;
  userId: string;
  type: RetrospectiveType;
  completedAt: Date;
  insights?: Record<string, any>;
  skillUpdates?: Record<string, any>;
  goalsReviewed?: Record<string, any>;
}

export interface CohortComparison {
  userId: string;
  interest: string;
  percentile: number;
  cohortSize: number;
  ageRange: AgeRange;
  intentLevel: CommitmentLevel;
  encouragingMessage: string;
}

export interface CohortStats {
  id: string;
  ageRangeMin: number;
  ageRangeMax: number;
  interestCategory: string;
  intentLevel: CommitmentLevel;
  skillLevel: SkillLevel;
  userCount: number;
  percentileData: Record<string, any>;
  updatedAt: Date;
}

export interface FamilyRelationship {
  id: string;
  parentUserId: string;
  childUserId: string;
  relationshipType: string;
  childConsentGiven: boolean;
  createdAt: Date;
}

export interface FamilyActivityLog {
  id: string;
  relationshipId: string;
  actionType: string;
  performedByUserId: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface PrivacyPreferences {
  allowPeerComparisons: boolean;
  allowFamilyViewing: boolean;
  shareGoalsWithFamily: boolean;
  shareProgressWithFamily: boolean;
  allowAnonymousDataCollection: boolean;
  dataRetentionConsent: boolean;
}

export interface PredefinedPath {
  id: string;
  interestCategory: string;
  pathName: string;
  description?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  intentLevels: CommitmentLevel[];
  stages: PathStage[];
  synergies?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PathStage {
  stage: number;
  name: string;
  description: string;
  requirements: {
    level: SkillLevel;
    [key: string]: any;
  };
}

export interface UserPathProgress {
  id: string;
  userId: string;
  pathId: string;
  currentStage: number;
  stagesCompleted: number[];
  startedAt: Date;
  lastUpdated: Date;
}

export interface SimulationScenario {
  id: string;
  userId: string;
  scenarioName: string;
  effortAllocation: Record<string, number>; // skill -> effort percentage
  forecastedResults: Record<string, any>;
  timeframeWeeks: number;
  createdAt: Date;
  isConvertedToGoals: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface OnboardingData {
  interests: {
    category: string;
    subcategory?: string;
    level: SkillLevel;
    intent: CommitmentLevel;
  }[];
}

export interface GoalFormData {
  interestCategory: string;
  goalType: GoalType;
  title: string;
  description: string;
  targetLevel?: SkillLevel;
  timeframe: Timeframe;
  targetDate?: Date;
}

export interface RetrospectiveFormData {
  type: RetrospectiveType;
  insights: Record<string, any>;
  skillUpdates: Record<string, SkillLevel>;
  goalsReviewed: string[];
}

// Chart data types for D3.js visualizations
export interface RadarChartData {
  skill: string;
  value: number;
  maxValue: number;
  color?: string;
}

export interface LifeStatMatrixData {
  current: RadarChartData[];
  historical?: {
    date: Date;
    data: RadarChartData[];
  }[];
}

// Interest categories (can be expanded)
export const INTEREST_CATEGORIES = [
  "Music",
  "Sports",
  "Math",
  "Communication",
  "Creativity",
  "Technical",
  "Health",
  "Science",
  "Languages",
  "Arts",
  "Reading",
  "Writing",
  "Gaming",
  "Cooking",
  "Other",
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

// Validation schemas (using Zod)
export const skillLevelSchema = {
  min: 1,
  max: 4,
  values: [1, 2, 3, 4] as const,
};

export const commitmentLevelSchema = {
  values: ["casual", "average", "invested", "competitive"] as const,
};

// Helper functions
export function getSkillLevelName(level: SkillLevel): string {
  switch (level) {
    case SkillLevel.NOVICE:
      return "Novice";
    case SkillLevel.INTERMEDIATE:
      return "Intermediate";
    case SkillLevel.ADVANCED:
      return "Advanced";
    case SkillLevel.EXPERT:
      return "Expert";
    default:
      return "Unknown";
  }
}

export function getCommitmentLevelName(level: CommitmentLevel): string {
  switch (level) {
    case CommitmentLevel.CASUAL:
      return "Casual";
    case CommitmentLevel.AVERAGE:
      return "Average";
    case CommitmentLevel.INVESTED:
      return "Invested";
    case CommitmentLevel.COMPETITIVE:
      return "Competitive";
    default:
      return "Unknown";
  }
}

export function parseAgeRange(ageRangeString: string): AgeRange {
  if (ageRangeString === "51+") {
    return { min: 51, max: 99 };
  }

  const [min, max] = ageRangeString.split("-").map(Number);
  return { min, max };
}
// Database query result types
export interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  age_range_min: number;
  age_range_max: number;
  created_at: Date;
  last_active: Date;
  family_mode_enabled: boolean;
  onboarding_completed: boolean;
}

export interface DatabaseInterest {
  id: string;
  user_id: string;
  category: string;
  subcategory?: string;
  current_level: number;
  intent_level: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseGoal {
  id: string;
  user_id: string;
  interest_category: string;
  goal_type: string;
  title: string;
  description: string;
  target_level?: number;
  timeframe: string;
  status: string;
  created_at: Date;
  target_date?: Date;
  completed_at?: Date;
}

// Query filter types
export interface UserFilters {
  ageRangeMin?: number;
  ageRangeMax?: number;
  familyModeEnabled?: boolean;
  onboardingCompleted?: boolean;
  lastActiveAfter?: Date;
}

export interface GoalFilters {
  status?: GoalStatus;
  goalType?: GoalType;
  timeframe?: Timeframe;
  interestCategory?: string;
  createdAfter?: Date;
  targetDateBefore?: Date;
}

export interface InterestFilters {
  category?: string;
  currentLevel?: SkillLevel;
  intentLevel?: CommitmentLevel;
  updatedAfter?: Date;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Aggregation and analytics types
export interface SkillLevelDistribution {
  skillLevel: SkillLevel;
  count: number;
  percentage: number;
}

export interface InterestAnalytics {
  category: string;
  totalUsers: number;
  averageLevel: number;
  levelDistribution: SkillLevelDistribution[];
  intentDistribution: Record<CommitmentLevel, number>;
}

export interface UserProgressSummary {
  userId: string;
  totalInterests: number;
  averageSkillLevel: number;
  activeGoals: number;
  completedGoals: number;
  lastRetrospective?: Date;
  skillImprovements: {
    category: string;
    previousLevel: SkillLevel;
    currentLevel: SkillLevel;
    improvementDate: Date;
  }[];
}

// Comparison and ranking types
export interface UserRanking {
  userId: string;
  category: string;
  skillLevel: SkillLevel;
  percentile: number;
  rank: number;
  totalInCohort: number;
}

export interface CohortComparison {
  userId: string;
  category: string;
  userLevel: SkillLevel;
  cohortStats: {
    ageRangeMin: number;
    ageRangeMax: number;
    intentLevel: CommitmentLevel;
    totalUsers: number;
    averageLevel: number;
    percentiles: Record<string, number>;
  };
  userPercentile: number;
  encouragingMessage: string;
}

// Error types for better error handling
export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

export interface ValidationError extends Error {
  field?: string;
  value?: any;
  constraint?: string;
}

// Utility types for type safety
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Database operation result types
export interface CreateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  rowsAffected: number;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  rowsAffected: number;
  error?: string;
}

// Batch operation types
export interface BatchCreateResult<T> {
  success: boolean;
  created: T[];
  failed: Array<{
    data: any;
    error: string;
  }>;
  totalAttempted: number;
  totalCreated: number;
  totalFailed: number;
}

// Advanced query types
export interface JoinQuery {
  table: string;
  on: string;
  type?: "INNER" | "LEFT" | "RIGHT" | "FULL";
}

export interface QueryBuilder {
  select?: string[];
  from: string;
  joins?: JoinQuery[];
  where?: Record<string, any>;
  orderBy?: Array<{
    column: string;
    direction: "ASC" | "DESC";
  }>;
  limit?: number;
  offset?: number;
}

// Type guards for runtime type checking
export function isDatabaseUser(obj: any): obj is DatabaseUser {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.password_hash === "string" &&
    typeof obj.age_range_min === "number" &&
    typeof obj.age_range_max === "number"
  );
}

export function isDatabaseInterest(obj: any): obj is DatabaseInterest {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.category === "string" &&
    typeof obj.current_level === "number" &&
    typeof obj.intent_level === "string"
  );
}

export function isDatabaseGoal(obj: any): obj is DatabaseGoal {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.interest_category === "string" &&
    typeof obj.goal_type === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string"
  );
}

// Constants for database constraints
export const DATABASE_CONSTRAINTS = {
  EMAIL_MAX_LENGTH: 255,
  TITLE_MAX_LENGTH: 255,
  CATEGORY_MAX_LENGTH: 50,
  SUBCATEGORY_MAX_LENGTH: 50,
  INTENT_LEVEL_MAX_LENGTH: 20,
  GOAL_TYPE_MAX_LENGTH: 20,
  TIMEFRAME_MAX_LENGTH: 20,
  STATUS_MAX_LENGTH: 20,
  RETROSPECTIVE_TYPE_MAX_LENGTH: 20,
  PATH_NAME_MAX_LENGTH: 255,
  SCENARIO_NAME_MAX_LENGTH: 255,
  MIN_AGE: 6,
  MAX_AGE: 99,
  MIN_SKILL_LEVEL: 1,
  MAX_SKILL_LEVEL: 4,
  MIN_TIMEFRAME_WEEKS: 1,
  MAX_TIMEFRAME_WEEKS: 52,
} as const;

// Export all validation functions from validation.ts for convenience
export * from "../lib/validation";
