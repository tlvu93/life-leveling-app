import {
  SkillLevel,
  CommitmentLevel,
  GoalType,
  Timeframe,
  GoalStatus,
  RetrospectiveType,
  INTEREST_CATEGORIES,
  InterestCategory,
} from "@/types";

// Type Guards
export function isSkillLevel(value: any): value is SkillLevel {
  return typeof value === "number" && value >= 1 && value <= 4;
}

export function isCommitmentLevel(value: any): value is CommitmentLevel {
  return (
    typeof value === "string" &&
    ["casual", "average", "invested", "competitive"].includes(value)
  );
}

export function isGoalType(value: any): value is GoalType {
  return (
    typeof value === "string" &&
    ["skill_increase", "project_completion", "broad_promise"].includes(value)
  );
}

export function isTimeframe(value: any): value is Timeframe {
  return (
    typeof value === "string" && ["weekly", "monthly", "yearly"].includes(value)
  );
}

export function isGoalStatus(value: any): value is GoalStatus {
  return (
    typeof value === "string" &&
    ["active", "completed", "paused", "cancelled"].includes(value)
  );
}

export function isRetrospectiveType(value: any): value is RetrospectiveType {
  return (
    typeof value === "string" && ["weekly", "monthly", "yearly"].includes(value)
  );
}

export function isInterestCategory(value: any): value is InterestCategory {
  return (
    typeof value === "string" &&
    INTEREST_CATEGORIES.includes(value as InterestCategory)
  );
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validation Functions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateUserRegistration(data: {
  email: string;
  password: string;
  ageRangeMin: number;
  ageRangeMax: number;
}): ValidationResult {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !isValidEmail(data.email)) {
    errors.push("Valid email address is required");
  }

  // Password validation
  if (!data.password || data.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Age range validation
  if (
    !Number.isInteger(data.ageRangeMin) ||
    data.ageRangeMin < 6 ||
    data.ageRangeMin > 99
  ) {
    errors.push("Age range minimum must be between 6 and 99");
  }

  if (
    !Number.isInteger(data.ageRangeMax) ||
    data.ageRangeMax < 6 ||
    data.ageRangeMax > 99
  ) {
    errors.push("Age range maximum must be between 6 and 99");
  }

  if (data.ageRangeMin > data.ageRangeMax) {
    errors.push("Age range minimum cannot be greater than maximum");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateInterest(data: {
  category: string;
  subcategory?: string;
  currentLevel: any;
  intentLevel: any;
}): ValidationResult {
  const errors: string[] = [];

  // Category validation
  if (!data.category || !isInterestCategory(data.category)) {
    errors.push("Valid interest category is required");
  }

  // Subcategory validation (optional but must be string if provided)
  if (data.subcategory !== undefined && typeof data.subcategory !== "string") {
    errors.push("Subcategory must be a string");
  }

  // Current level validation
  if (!isSkillLevel(data.currentLevel)) {
    errors.push("Current level must be between 1 and 4");
  }

  // Intent level validation
  if (!isCommitmentLevel(data.intentLevel)) {
    errors.push(
      "Intent level must be one of: casual, average, invested, competitive"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateGoal(data: {
  interestCategory: string;
  goalType: any;
  title: string;
  description: string;
  targetLevel?: any;
  timeframe: any;
  targetDate?: Date;
}): ValidationResult {
  const errors: string[] = [];

  // Interest category validation
  if (!data.interestCategory || !isInterestCategory(data.interestCategory)) {
    errors.push("Valid interest category is required");
  }

  // Goal type validation
  if (!isGoalType(data.goalType)) {
    errors.push(
      "Goal type must be one of: skill_increase, project_completion, broad_promise"
    );
  }

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push("Goal title is required");
  } else if (data.title.length > 255) {
    errors.push("Goal title must be 255 characters or less");
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.push("Goal description is required");
  }

  // Target level validation (optional for some goal types)
  if (data.targetLevel !== undefined && !isSkillLevel(data.targetLevel)) {
    errors.push("Target level must be between 1 and 4");
  }

  // Timeframe validation
  if (!isTimeframe(data.timeframe)) {
    errors.push("Timeframe must be one of: weekly, monthly, yearly");
  }

  // Target date validation (optional)
  if (data.targetDate !== undefined) {
    if (
      !(data.targetDate instanceof Date) ||
      isNaN(data.targetDate.getTime())
    ) {
      errors.push("Target date must be a valid date");
    } else if (data.targetDate <= new Date()) {
      errors.push("Target date must be in the future");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRetrospective(data: {
  type: any;
  insights?: Record<string, any>;
  skillUpdates?: Record<string, any>;
  goalsReviewed?: Record<string, any>;
}): ValidationResult {
  const errors: string[] = [];

  // Type validation
  if (!isRetrospectiveType(data.type)) {
    errors.push("Retrospective type must be one of: weekly, monthly, yearly");
  }

  // Insights validation (optional)
  if (data.insights !== undefined && typeof data.insights !== "object") {
    errors.push("Insights must be an object");
  }

  // Skill updates validation (optional)
  if (data.skillUpdates !== undefined) {
    if (typeof data.skillUpdates !== "object") {
      errors.push("Skill updates must be an object");
    } else {
      // Validate skill update values are valid skill levels
      for (const [key, value] of Object.entries(data.skillUpdates)) {
        if (!isSkillLevel(value)) {
          errors.push(
            `Skill update for ${key} must be a valid skill level (1-4)`
          );
        }
      }
    }
  }

  // Goals reviewed validation (optional)
  if (
    data.goalsReviewed !== undefined &&
    typeof data.goalsReviewed !== "object"
  ) {
    errors.push("Goals reviewed must be an object");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSimulationScenario(data: {
  scenarioName: string;
  effortAllocation: Record<string, number>;
  timeframeWeeks: number;
}): ValidationResult {
  const errors: string[] = [];

  // Scenario name validation
  if (!data.scenarioName || data.scenarioName.trim().length === 0) {
    errors.push("Scenario name is required");
  } else if (data.scenarioName.length > 255) {
    errors.push("Scenario name must be 255 characters or less");
  }

  // Effort allocation validation
  if (!data.effortAllocation || typeof data.effortAllocation !== "object") {
    errors.push("Effort allocation must be an object");
  } else {
    let totalEffort = 0;
    for (const [skill, effort] of Object.entries(data.effortAllocation)) {
      if (typeof effort !== "number" || effort < 0 || effort > 100) {
        errors.push(`Effort for ${skill} must be a number between 0 and 100`);
      }
      totalEffort += effort;
    }

    if (Math.abs(totalEffort - 100) > 0.01) {
      errors.push("Total effort allocation must equal 100%");
    }
  }

  // Timeframe validation
  if (
    !Number.isInteger(data.timeframeWeeks) ||
    data.timeframeWeeks < 1 ||
    data.timeframeWeeks > 52
  ) {
    errors.push("Timeframe must be between 1 and 52 weeks");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAgeRange(
  ageRangeMin: number,
  ageRangeMax: number
): ValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(ageRangeMin) || ageRangeMin < 6 || ageRangeMin > 99) {
    errors.push("Age range minimum must be between 6 and 99");
  }

  if (!Number.isInteger(ageRangeMax) || ageRangeMax < 6 || ageRangeMax > 99) {
    errors.push("Age range maximum must be between 6 and 99");
  }

  if (ageRangeMin > ageRangeMax) {
    errors.push("Age range minimum cannot be greater than maximum");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitization Functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeInterestCategory(category: string): string {
  const sanitized = sanitizeString(category);
  return INTEREST_CATEGORIES.includes(sanitized as InterestCategory)
    ? sanitized
    : "Other";
}

// Data transformation helpers
export function normalizeSkillLevel(level: any): SkillLevel | null {
  const num = Number(level);
  if (isSkillLevel(num)) {
    return num;
  }
  return null;
}

export function normalizeCommitmentLevel(level: any): CommitmentLevel | null {
  if (typeof level === "string") {
    const normalized = level.toLowerCase().trim();
    if (isCommitmentLevel(normalized)) {
      return normalized;
    }
  }
  return null;
}

// Batch validation for onboarding data
export function validateOnboardingData(data: {
  interests: Array<{
    category: string;
    subcategory?: string;
    level: any;
    intent: any;
  }>;
}): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data.interests)) {
    errors.push("Interests must be an array");
    return { isValid: false, errors };
  }

  if (data.interests.length === 0) {
    errors.push("At least one interest is required");
  }

  if (data.interests.length > 8) {
    errors.push("Maximum 8 interests allowed");
  }

  // Validate each interest
  data.interests.forEach((interest, index) => {
    const validation = validateInterest({
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.level,
      intentLevel: interest.intent,
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        errors.push(`Interest ${index + 1}: ${error}`);
      });
    }
  });

  // Check for duplicate categories
  const categories = data.interests.map((i) => i.category);
  const duplicates = categories.filter(
    (category, index) => categories.indexOf(category) !== index
  );
  if (duplicates.length > 0) {
    errors.push(`Duplicate interest categories: ${duplicates.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Error formatting for API responses
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 1) {
    return errors[0];
  }
  return `Multiple validation errors: ${errors.join("; ")}`;
}
