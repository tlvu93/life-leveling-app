import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { Interest, SkillLevel } from "@/types";
import { ScenarioCache } from "@/lib/scenario-cache";

interface SimulationRequest {
  effortAllocation: Record<string, number>;
  timeframeWeeks: number;
  currentInterests: Interest[];
}

interface SimulationResult {
  projectedLevel: number;
  growthRate: number;
  synergyBonus: number;
  effortEfficiency: number;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await AuthService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SimulationRequest = await request.json();
    const { effortAllocation, timeframeWeeks, currentInterests } = body;

    // Validate input
    if (!effortAllocation || !timeframeWeeks || !currentInterests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResults = await ScenarioCache.getCachedSimulationResults(
      userId,
      effortAllocation
    );
    if (cachedResults) {
      return NextResponse.json({
        success: true,
        forecastedResults: cachedResults,
        cached: true,
      });
    }

    // Calculate forecasted results for each interest
    const forecastedResults: Record<string, SimulationResult> = {};

    for (const interest of currentInterests) {
      const effort = effortAllocation[interest.category] || 0;
      const result = calculateSkillGrowth(
        interest,
        effort,
        timeframeWeeks,
        currentInterests,
        effortAllocation
      );
      forecastedResults[interest.category] = result;
    }

    // Cache the results
    await ScenarioCache.cacheSimulationResults(
      userId,
      effortAllocation,
      forecastedResults
    );

    return NextResponse.json({
      success: true,
      forecastedResults,
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateSkillGrowth(
  interest: Interest,
  effort: number,
  timeframeWeeks: number,
  allInterests: Interest[],
  effortAllocation: Record<string, number>
): SimulationResult {
  // Base growth rate calculation
  const baseGrowthRate = calculateBaseGrowthRate(interest.currentLevel, effort);

  // Apply synergy bonuses
  const synergyBonus = calculateSynergyBonus(
    interest,
    allInterests,
    effortAllocation
  );

  // Apply commitment level multiplier
  const commitmentMultiplier = getCommitmentMultiplier(interest.intentLevel);

  // Apply diminishing returns for high-level skills
  const diminishingReturns = calculateDiminishingReturns(interest.currentLevel);

  // Calculate total growth rate
  const totalGrowthRate =
    baseGrowthRate *
    commitmentMultiplier *
    diminishingReturns *
    (1 + synergyBonus);

  // Calculate projected level based on timeframe
  const growthAmount = (totalGrowthRate * timeframeWeeks) / 52; // Convert to yearly rate
  const projectedLevel = Math.min(4, interest.currentLevel + growthAmount);

  // Calculate effort efficiency (how much growth per unit of effort)
  const effortEfficiency = effort > 0 ? growthAmount / (effort / 100) : 0;

  return {
    projectedLevel: Math.round(projectedLevel * 10) / 10, // Round to 1 decimal
    growthRate: Math.round(totalGrowthRate * 100) / 100,
    synergyBonus: Math.round(synergyBonus * 100) / 100,
    effortEfficiency: Math.round(effortEfficiency * 100) / 100,
  };
}

function calculateBaseGrowthRate(
  currentLevel: SkillLevel,
  effort: number
): number {
  // Base growth rates by current level (lower levels grow faster)
  const levelMultipliers = {
    [SkillLevel.NOVICE]: 1.0,
    [SkillLevel.INTERMEDIATE]: 0.8,
    [SkillLevel.ADVANCED]: 0.6,
    [SkillLevel.EXPERT]: 0.4,
  };

  // Effort curve (diminishing returns on very high effort)
  const effortMultiplier = Math.min(1.0, (effort / 100) * 1.2);

  return levelMultipliers[currentLevel] * effortMultiplier;
}

function calculateSynergyBonus(
  interest: Interest,
  allInterests: Interest[],
  effortAllocation: Record<string, number>
): number {
  const synergyMap = getSynergyMap();
  const relatedSkills = synergyMap[interest.category] || {};

  let totalSynergyBonus = 0;

  Object.entries(relatedSkills).forEach(([relatedSkill, synergyStrength]) => {
    const relatedInterest = allInterests.find(
      (i) => i.category === relatedSkill
    );
    if (relatedInterest) {
      const relatedEffort = effortAllocation[relatedSkill] || 0;

      // Synergy bonus is proportional to effort in related skill
      const synergyBonus = (relatedEffort / 100) * synergyStrength;
      totalSynergyBonus += synergyBonus;
    }
  });

  return Math.min(0.5, totalSynergyBonus); // Cap synergy bonus at 50%
}

function getCommitmentMultiplier(intentLevel: string): number {
  const multipliers = {
    casual: 0.8,
    average: 1.0,
    invested: 1.2,
    competitive: 1.4,
  };

  return multipliers[intentLevel as keyof typeof multipliers] || 1.0;
}

function calculateDiminishingReturns(currentLevel: SkillLevel): number {
  // Higher levels have diminishing returns
  const diminishingFactors = {
    [SkillLevel.NOVICE]: 1.0,
    [SkillLevel.INTERMEDIATE]: 0.9,
    [SkillLevel.ADVANCED]: 0.7,
    [SkillLevel.EXPERT]: 0.5,
  };

  return diminishingFactors[currentLevel];
}

function getSynergyMap(): Record<string, Record<string, number>> {
  return {
    Math: { Technical: 0.3, Science: 0.2 },
    Technical: { Math: 0.3, Creativity: 0.2 },
    Music: { Math: 0.2, Creativity: 0.3 },
    Sports: { Health: 0.4, Communication: 0.2 },
    Communication: { Sports: 0.2, Arts: 0.2 },
    Creativity: { Arts: 0.3, Music: 0.3, Technical: 0.2 },
    Arts: { Creativity: 0.3, Communication: 0.2 },
    Science: { Math: 0.2, Technical: 0.2 },
    Health: { Sports: 0.4, Cooking: 0.2 },
    Languages: { Communication: 0.3, Reading: 0.2 },
    Reading: { Writing: 0.4, Languages: 0.2 },
    Writing: { Reading: 0.4, Communication: 0.3 },
    Gaming: { Technical: 0.2 },
    Cooking: { Health: 0.2, Creativity: 0.2 },
  };
}
