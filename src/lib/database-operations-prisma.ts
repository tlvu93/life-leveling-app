import { prisma } from "./prisma";
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
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        ageRangeMin: userData.ageRangeMin,
        ageRangeMax: userData.ageRangeMax,
        familyModeEnabled: userData.familyModeEnabled || false,
      },
    });

    return {
      id: user.id,
      email: user.email,
      ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax,
      interests: [],
      familyModeEnabled: user.familyModeEnabled,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      return null;
    }

    const interests: Interest[] = user.interests.map((interest) => ({
      id: interest.id,
      userId: interest.userId,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.currentLevel as SkillLevel,
      intentLevel: interest.intentLevel as CommitmentLevel,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
    }));

    return {
      id: user.id,
      email: user.email,
      ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax,
      interests,
      familyModeEnabled: user.familyModeEnabled,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        interests: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    console.log("Prisma query result:", user);

    if (!user) {
      console.log("No user found with email:", email);
      return null;
    }

    const interests: Interest[] = user.interests.map((interest) => ({
      id: interest.id,
      userId: interest.userId,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.currentLevel as SkillLevel,
      intentLevel: interest.intentLevel as CommitmentLevel,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
    }));

    return {
      id: user.id,
      email: user.email,
      ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax,
      interests,
      familyModeEnabled: user.familyModeEnabled,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    throw new Error("Failed to get user by email");
  }
}

export async function getUserWithPasswordByEmail(
  email: string
): Promise<{ user: UserProfile; passwordHash: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        interests: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      return null;
    }

    const interests: Interest[] = user.interests.map((interest) => ({
      id: interest.id,
      userId: interest.userId,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.currentLevel as SkillLevel,
      intentLevel: interest.intentLevel as CommitmentLevel,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
    }));

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax,
      interests,
      familyModeEnabled: user.familyModeEnabled,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };

    return {
      user: userProfile,
      passwordHash: user.passwordHash,
    };
  } catch (error) {
    console.error("Error getting user with password by email:", error);
    throw new Error("Failed to get user with password by email");
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
  } catch (error) {
    console.error("Error updating user last active:", error);
    throw new Error("Failed to update user last active");
  }
}

export async function completeOnboarding(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
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
    const interest = await prisma.userInterest.create({
      data: {
        userId: interestData.userId,
        category: interestData.category,
        subcategory: interestData.subcategory || null,
        currentLevel: interestData.currentLevel,
        intentLevel: interestData.intentLevel,
      },
    });

    // TODO: Trigger cohort stats update in background

    return {
      id: interest.id,
      userId: interest.userId,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.currentLevel as SkillLevel,
      intentLevel: interest.intentLevel as CommitmentLevel,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
    };
  } catch (error) {
    console.error("Error creating user interest:", error);
    throw new Error("Failed to create user interest");
  }
}

export async function getUserInterests(userId: string): Promise<Interest[]> {
  try {
    const interests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return interests.map((interest) => ({
      id: interest.id,
      userId: interest.userId,
      category: interest.category,
      subcategory: interest.subcategory,
      currentLevel: interest.currentLevel as SkillLevel,
      intentLevel: interest.intentLevel as CommitmentLevel,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
    }));
  } catch (error) {
    console.error("Error getting user interests:", error);
    throw new Error("Failed to get user interests");
  }
}
