import {
  PredefinedPath,
  UserPathProgress,
  PathStage,
  SkillLevel,
  CommitmentLevel,
  Interest,
} from "@/types";
import {
  getPathsForUser,
  getPathById,
  startUserPath,
  updateUserPathProgress,
  getUserPathProgress,
  getUserPathsWithProgress,
  getUserInterests,
} from "./database-operations";

// Path recommendation system
export interface PathRecommendation {
  path: PredefinedPath;
  relevanceScore: number;
  reasons: string[];
  requiredLevel: SkillLevel;
  currentUserLevel?: SkillLevel;
  canStart: boolean;
}

// Milestone system
export interface PathMilestone {
  stageNumber: number;
  stageName: string;
  description: string;
  requirements: {
    level: SkillLevel;
    [key: string]: unknown;
  };
  isUnlocked: boolean;
  isCompleted: boolean;
  synergyBonuses?: Record<string, number>;
}

// Age-appropriate path filtering
export function filterPathsByAge(
  paths: PredefinedPath[],
  userAge: number
): PredefinedPath[] {
  return paths.filter((path) => {
    if (path.ageRangeMin && userAge < path.ageRangeMin) return false;
    if (path.ageRangeMax && userAge > path.ageRangeMax) return false;
    return true;
  });
}

// Commitment level path branching
export function getPathBranchesForCommitment(
  path: PredefinedPath,
  commitmentLevel: CommitmentLevel
): PathStage[] {
  // Filter stages based on commitment level
  // More committed users get additional advanced stages
  const baseStages = path.stages;

  switch (commitmentLevel) {
    case CommitmentLevel.CASUAL:
      // Casual users get first 2-3 stages
      return baseStages.slice(0, Math.min(3, baseStages.length));

    case CommitmentLevel.AVERAGE:
      // Average users get most stages
      return baseStages.slice(0, Math.min(4, baseStages.length));

    case CommitmentLevel.INVESTED:
      // Invested users get all stages
      return baseStages;

    case CommitmentLevel.COMPETITIVE:
      // Competitive users get all stages plus potential advanced branches
      return baseStages;

    default:
      return baseStages;
  }
}

// Path recommendation engine
export async function getPathRecommendations(
  userId: string,
  limit: number = 5
): Promise<PathRecommendation[]> {
  try {
    const [userInterests, availablePaths] = await Promise.all([
      getUserInterests(userId),
      getPathsForUser(userId),
    ]);

    const recommendations: PathRecommendation[] = [];

    for (const path of availablePaths) {
      const relevantInterest = userInterests.find(
        (interest) => interest.category === path.interestCategory
      );

      if (!relevantInterest) continue;

      const relevanceScore = calculatePathRelevance(path, relevantInterest);
      const canStart = relevantInterest.currentLevel >= SkillLevel.NOVICE;
      const reasons = generateRecommendationReasons(path, relevantInterest);

      recommendations.push({
        path,
        relevanceScore,
        reasons,
        requiredLevel: path.stages[0]?.requirements.level || SkillLevel.NOVICE,
        currentUserLevel: relevantInterest.currentLevel,
        canStart,
      });
    }

    // Sort by relevance score and return top recommendations
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting path recommendations:", error);
    throw new Error("Failed to get path recommendations");
  }
}

function calculatePathRelevance(
  path: PredefinedPath,
  userInterest: Interest
): number {
  let score = 0;

  // Base score for matching interest category
  score += 50;

  // Bonus for matching commitment level
  if (path.intentLevels.includes(userInterest.intentLevel)) {
    score += 30;
  }

  // Bonus for appropriate skill level
  const firstStageLevel =
    path.stages[0]?.requirements.level || SkillLevel.NOVICE;
  if (userInterest.currentLevel >= firstStageLevel) {
    score += 20;
  } else if (userInterest.currentLevel === firstStageLevel - 1) {
    score += 10; // Close to ready
  }

  // Bonus for synergies with other user interests
  // This would require additional logic to check other interests

  return score;
}

function generateRecommendationReasons(
  path: PredefinedPath,
  userInterest: Interest
): string[] {
  const reasons: string[] = [];

  if (path.intentLevels.includes(userInterest.intentLevel)) {
    reasons.push(`Matches your ${userInterest.intentLevel} commitment level`);
  }

  const firstStageLevel =
    path.stages[0]?.requirements.level || SkillLevel.NOVICE;
  if (userInterest.currentLevel >= firstStageLevel) {
    reasons.push("You're ready to start this path");
  } else {
    reasons.push(`You'll be ready after reaching level ${firstStageLevel}`);
  }

  if (path.synergies && Object.keys(path.synergies).length > 0) {
    reasons.push("This path has synergies with other skills");
  }

  return reasons;
}

// Milestone and unlock system
export async function getPathMilestones(
  userId: string,
  pathId: string
): Promise<PathMilestone[]> {
  try {
    const [path, progressList, userInterests] = await Promise.all([
      getPathById(pathId),
      getUserPathProgress(userId, pathId),
      getUserInterests(userId),
    ]);

    if (!path) {
      throw new Error("Path not found");
    }

    const progress = progressList[0]; // Should be only one for specific path
    const relevantInterest = userInterests.find(
      (interest) => interest.category === path.interestCategory
    );

    if (!relevantInterest) {
      throw new Error("User doesn't have this interest");
    }

    // Get commitment-appropriate stages
    const availableStages = getPathBranchesForCommitment(
      path,
      relevantInterest.intentLevel
    );

    const milestones: PathMilestone[] = availableStages.map((stage, index) => {
      const isCompleted =
        progress?.stagesCompleted.includes(stage.stage) || false;
      const isUnlocked = checkStageUnlocked(
        stage,
        relevantInterest.currentLevel,
        progress?.currentStage || 0,
        index
      );

      return {
        stageNumber: stage.stage,
        stageName: stage.name,
        description: stage.description,
        requirements: stage.requirements,
        isUnlocked,
        isCompleted,
        synergyBonuses: path.synergies,
      };
    });

    return milestones;
  } catch (error) {
    console.error("Error getting path milestones:", error);
    throw new Error("Failed to get path milestones");
  }
}

function checkStageUnlocked(
  stage: PathStage,
  userLevel: SkillLevel,
  currentStage: number,
  stageIndex: number
): boolean {
  // First stage is always unlocked if user meets level requirement
  if (stageIndex === 0) {
    return userLevel >= stage.requirements.level;
  }

  // Subsequent stages require previous stage completion and level requirement
  return currentStage >= stageIndex && userLevel >= stage.requirements.level;
}

// Progress tracking and stage completion
export async function completePathStage(
  userId: string,
  pathId: string,
  stageNumber: number
): Promise<UserPathProgress> {
  try {
    const progressList = await getUserPathProgress(userId, pathId);
    let progress = progressList[0];

    if (!progress) {
      // Start the path if not already started
      progress = await startUserPath(userId, pathId);
    }

    const newStagesCompleted = [...progress.stagesCompleted];
    if (!newStagesCompleted.includes(stageNumber)) {
      newStagesCompleted.push(stageNumber);
    }

    const newCurrentStage = Math.max(progress.currentStage, stageNumber);

    return await updateUserPathProgress(
      userId,
      pathId,
      newCurrentStage,
      newStagesCompleted
    );
  } catch (error) {
    console.error("Error completing path stage:", error);
    throw new Error("Failed to complete path stage");
  }
}

// Synergy calculation system
export interface SkillSynergy {
  sourceSkill: string;
  targetSkill: string;
  synergyFactor: number;
  description: string;
}

export function calculateSkillSynergies(
  userInterests: Interest[],
  paths: PredefinedPath[]
): SkillSynergy[] {
  const synergies: SkillSynergy[] = [];

  for (const path of paths) {
    if (!path.synergies) continue;

    const sourceInterest = userInterests.find(
      (interest) => interest.category === path.interestCategory
    );

    if (!sourceInterest) continue;

    for (const [targetSkill, synergyFactor] of Object.entries(path.synergies)) {
      const targetInterest = userInterests.find(
        (interest) => interest.category === targetSkill
      );

      if (targetInterest) {
        synergies.push({
          sourceSkill: path.interestCategory,
          targetSkill,
          synergyFactor,
          description: `${
            path.interestCategory
          } skills boost ${targetSkill} development by ${Math.round(
            synergyFactor * 100
          )}%`,
        });
      }
    }
  }

  return synergies;
}

// Path continuity maintenance
export async function maintainPathContinuity(
  userId: string,
  updatedInterest: Interest
): Promise<void> {
  try {
    // Get all user's path progress for this interest category
    const userPaths = await getUserPathsWithProgress(userId);
    const relevantPaths = userPaths.filter(
      (pathWithProgress) =>
        pathWithProgress.interestCategory === updatedInterest.category &&
        pathWithProgress.progress
    );

    for (const pathWithProgress of relevantPaths) {
      if (!pathWithProgress.progress) continue;

      const path = pathWithProgress;
      const progress = pathWithProgress.progress;

      // Check if commitment level change affects available stages
      const newAvailableStages = getPathBranchesForCommitment(
        path,
        updatedInterest.intentLevel
      );

      // If user downgraded commitment and current stage is beyond new limit
      const maxAllowedStage = newAvailableStages.length - 1;
      if (progress.currentStage > maxAllowedStage) {
        // Adjust current stage but keep completed stages for potential future upgrade
        await updateUserPathProgress(
          userId,
          path.id,
          maxAllowedStage,
          progress.stagesCompleted
        );
      }

      // If user upgraded commitment, they might unlock new stages
      // No action needed as they'll see new stages in their milestone view
    }
  } catch (error) {
    console.error("Error maintaining path continuity:", error);
    // Don't throw error as this is a background maintenance task
  }
}

// Seed additional predefined paths
export const ADDITIONAL_PREDEFINED_PATHS: Omit<
  PredefinedPath,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    interestCategory: "Math",
    pathName: "Mathematical Thinking",
    description: "Develop logical reasoning and problem-solving skills",
    ageRangeMin: 8,
    ageRangeMax: 99,
    intentLevels: [
      CommitmentLevel.CASUAL,
      CommitmentLevel.AVERAGE,
      CommitmentLevel.INVESTED,
      CommitmentLevel.COMPETITIVE,
    ],
    stages: [
      {
        stage: 1,
        name: "Number Sense",
        description: "Understand basic number concepts and operations",
        requirements: { level: SkillLevel.NOVICE },
      },
      {
        stage: 2,
        name: "Problem Solver",
        description: "Apply math to solve real-world problems",
        requirements: { level: SkillLevel.INTERMEDIATE },
      },
      {
        stage: 3,
        name: "Abstract Thinker",
        description: "Work with advanced mathematical concepts",
        requirements: { level: SkillLevel.ADVANCED },
      },
      {
        stage: 4,
        name: "Mathematical Expert",
        description: "Teach others or pursue mathematical research",
        requirements: { level: SkillLevel.EXPERT },
      },
    ],
    synergies: {
      Technical: 0.4,
      Science: 0.3,
    },
  },
  {
    interestCategory: "Creativity",
    pathName: "Artistic Expression",
    description: "Explore and develop creative abilities across mediums",
    ageRangeMin: 6,
    ageRangeMax: 99,
    intentLevels: [
      CommitmentLevel.CASUAL,
      CommitmentLevel.AVERAGE,
      CommitmentLevel.INVESTED,
      CommitmentLevel.COMPETITIVE,
    ],
    stages: [
      {
        stage: 1,
        name: "Creative Explorer",
        description: "Try different art forms and find your favorites",
        requirements: { level: SkillLevel.NOVICE },
      },
      {
        stage: 2,
        name: "Skilled Creator",
        description: "Develop technique in chosen creative areas",
        requirements: { level: SkillLevel.INTERMEDIATE },
      },
      {
        stage: 3,
        name: "Original Artist",
        description: "Develop your unique creative voice and style",
        requirements: { level: SkillLevel.ADVANCED },
      },
      {
        stage: 4,
        name: "Creative Professional",
        description: "Share your art with the world or teach others",
        requirements: { level: SkillLevel.EXPERT },
      },
    ],
    synergies: {
      Music: 0.3,
      Communication: 0.2,
    },
  },
  {
    interestCategory: "Communication",
    pathName: "Effective Communication",
    description:
      "Build skills in speaking, writing, and connecting with others",
    ageRangeMin: 6,
    ageRangeMax: 99,
    intentLevels: [
      CommitmentLevel.CASUAL,
      CommitmentLevel.AVERAGE,
      CommitmentLevel.INVESTED,
      CommitmentLevel.COMPETITIVE,
    ],
    stages: [
      {
        stage: 1,
        name: "Clear Speaker",
        description: "Express ideas clearly in conversation",
        requirements: { level: SkillLevel.NOVICE },
      },
      {
        stage: 2,
        name: "Confident Presenter",
        description: "Present to groups and write effectively",
        requirements: { level: SkillLevel.INTERMEDIATE },
      },
      {
        stage: 3,
        name: "Persuasive Communicator",
        description: "Influence and inspire others through communication",
        requirements: { level: SkillLevel.ADVANCED },
      },
      {
        stage: 4,
        name: "Communication Leader",
        description: "Lead teams and teach communication skills",
        requirements: { level: SkillLevel.EXPERT },
      },
    ],
    synergies: {
      Creativity: 0.2,
      Sports: 0.2,
    },
  },
];
