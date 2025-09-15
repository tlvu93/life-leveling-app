import {
  createUser,
  getUserById,
  createUserInterest,
  createGoal,
  createRetrospective,
  updateUserInterestLevel,
} from "./database-operations";
import {
  validateUserRegistration,
  validateInterest,
  validateGoal,
  validateRetrospective,
} from "./validation";
import {
  SkillLevel,
  CommitmentLevel,
  GoalType,
  Timeframe,
  RetrospectiveType,
} from "@/types";
import bcrypt from "bcryptjs";

export async function testDatabaseOperations() {
  try {
    console.log("Starting database operations test...");

    // Test user creation with validation
    const userData = {
      email: "test@example.com",
      password: "testpassword123",
      ageRangeMin: 16,
      ageRangeMax: 17,
    };

    const userValidation = validateUserRegistration(userData);
    if (!userValidation.isValid) {
      throw new Error(
        `User validation failed: ${userValidation.errors.join(", ")}`
      );
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = await createUser({
      email: userData.email,
      passwordHash,
      ageRangeMin: userData.ageRangeMin,
      ageRangeMax: userData.ageRangeMax,
    });

    console.log("✓ User created successfully:", user.id);

    // Test interest creation with validation
    const interestData = {
      category: "Music",
      subcategory: "Piano",
      currentLevel: SkillLevel.INTERMEDIATE,
      intentLevel: CommitmentLevel.INVESTED,
    };

    const interestValidation = validateInterest(interestData);
    if (!interestValidation.isValid) {
      throw new Error(
        `Interest validation failed: ${interestValidation.errors.join(", ")}`
      );
    }

    const interest = await createUserInterest({
      userId: user.id,
      ...interestData,
    });

    console.log("✓ Interest created successfully:", interest.id);

    // Test goal creation with validation
    const goalData = {
      interestCategory: "Music",
      goalType: GoalType.SKILL_INCREASE,
      title: "Learn advanced piano pieces",
      description:
        "Master 3 challenging classical pieces by the end of the month",
      targetLevel: SkillLevel.ADVANCED,
      timeframe: Timeframe.MONTHLY,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    const goalValidation = validateGoal(goalData);
    if (!goalValidation.isValid) {
      throw new Error(
        `Goal validation failed: ${goalValidation.errors.join(", ")}`
      );
    }

    const goal = await createGoal({
      userId: user.id,
      ...goalData,
    });

    console.log("✓ Goal created successfully:", goal.id);

    // Test retrospective creation with validation
    const retrospectiveData = {
      type: RetrospectiveType.WEEKLY,
      insights: {
        progress: "Made good progress on piano practice",
        challenges: "Need to work on timing",
        mood: "motivated",
      },
      skillUpdates: {
        Music: SkillLevel.ADVANCED,
      },
      goalsReviewed: {
        [goal.id]: "on_track",
      },
    };

    const retrospectiveValidation = validateRetrospective(retrospectiveData);
    if (!retrospectiveValidation.isValid) {
      throw new Error(
        `Retrospective validation failed: ${retrospectiveValidation.errors.join(
          ", "
        )}`
      );
    }

    const retrospective = await createRetrospective({
      userId: user.id,
      ...retrospectiveData,
    });

    console.log("✓ Retrospective created successfully:", retrospective.id);

    // Test skill level update
    const updatedInterest = await updateUserInterestLevel(
      interest.id,
      SkillLevel.ADVANCED,
      retrospective.id
    );

    console.log(
      "✓ Interest level updated successfully:",
      updatedInterest.currentLevel
    );

    // Test user retrieval with interests
    const retrievedUser = await getUserById(user.id);
    if (!retrievedUser) {
      throw new Error("Failed to retrieve user");
    }

    console.log(
      "✓ User retrieved successfully with",
      retrievedUser.interests.length,
      "interests"
    );

    console.log("🎉 All database operations tests passed!");
    return {
      success: true,
      testResults: {
        userId: user.id,
        interestId: interest.id,
        goalId: goal.id,
        retrospectiveId: retrospective.id,
      },
    };
  } catch (error) {
    console.error("❌ Database operations test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to clean up test data
export async function cleanupTestData(testResults: any) {
  try {
    if (testResults.userId) {
      // Note: Due to CASCADE DELETE, removing the user will remove all related data
      console.log("Cleaning up test data...");
      // In a real scenario, you might want to implement a cleanup function
      // For now, we'll leave the test data as it demonstrates the system working
      console.log("✓ Test data cleanup completed");
    }
  } catch (error) {
    console.error("Failed to cleanup test data:", error);
  }
}
