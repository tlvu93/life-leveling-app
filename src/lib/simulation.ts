import {
  CommitmentLevel,
  SkillLevel,
  type ForecastedResults,
  type Interest,
  type SimulationResult,
} from "@/types";

/**
 * Architect-mode forecast maths.
 *
 * This lives in `src/lib` rather than inside the route handler so the UI
 * (TradeOffAnalysis, SimulationVisualization) and the API agree on one synergy
 * table and one `SimulationResult` shape, and so the maths is unit-testable
 * without spinning up a request.
 */

export const MAX_SKILL_LEVEL = SkillLevel.EXPERT;

/** Synergy strength: practising the key skill lifts each related skill by N. */
export const SYNERGY_MAP: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = {
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

/** Cap on the combined synergy multiplier (+50%). */
export const MAX_SYNERGY_BONUS = 0.5;

/** Lower levels grow faster than higher ones. */
const LEVEL_GROWTH_MULTIPLIERS: Record<SkillLevel, number> = {
  [SkillLevel.NOVICE]: 1.0,
  [SkillLevel.INTERMEDIATE]: 0.8,
  [SkillLevel.ADVANCED]: 0.6,
  [SkillLevel.EXPERT]: 0.4,
};

/** Higher levels also plateau; applied on top of the growth multiplier. */
const DIMINISHING_RETURN_FACTORS: Record<SkillLevel, number> = {
  [SkillLevel.NOVICE]: 1.0,
  [SkillLevel.INTERMEDIATE]: 0.9,
  [SkillLevel.ADVANCED]: 0.7,
  [SkillLevel.EXPERT]: 0.5,
};

const COMMITMENT_MULTIPLIERS: Record<CommitmentLevel, number> = {
  [CommitmentLevel.CASUAL]: 0.8,
  [CommitmentLevel.AVERAGE]: 1.0,
  [CommitmentLevel.INVESTED]: 1.2,
  [CommitmentLevel.COMPETITIVE]: 1.4,
};

/** Round to one decimal place. */
const round1 = (value: number) => Math.round(value * 10) / 10;
/** Round to two decimal places. */
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Skill levels arrive from the database and from request bodies, so they are
 * not guaranteed to be one of the four enum members. Clamp instead of indexing
 * blindly — an out-of-range level used to produce `undefined * n === NaN`,
 * which silently poisoned every downstream metric.
 */
function clampLevel(level: number): SkillLevel {
  if (!Number.isFinite(level)) return SkillLevel.NOVICE;
  const rounded = Math.round(level);
  if (rounded <= SkillLevel.NOVICE) return SkillLevel.NOVICE;
  if (rounded >= SkillLevel.EXPERT) return SkillLevel.EXPERT;
  return rounded as SkillLevel;
}

/** Effort percentages come from sliders; keep them inside 0–100. */
function clampEffort(effort: number): number {
  if (!Number.isFinite(effort)) return 0;
  return Math.min(100, Math.max(0, effort));
}

export function getCommitmentMultiplier(intentLevel: string): number {
  return COMMITMENT_MULTIPLIERS[intentLevel as CommitmentLevel] ?? 1.0;
}

export function calculateBaseGrowthRate(
  currentLevel: SkillLevel,
  effort: number
): number {
  // Effort has diminishing returns past ~83%, where the curve saturates.
  const effortMultiplier = Math.min(1.0, (clampEffort(effort) / 100) * 1.2);
  return LEVEL_GROWTH_MULTIPLIERS[clampLevel(currentLevel)] * effortMultiplier;
}

export function calculateDiminishingReturns(currentLevel: SkillLevel): number {
  return DIMINISHING_RETURN_FACTORS[clampLevel(currentLevel)];
}

/**
 * Bonus earned by also investing effort in skills related to `category`.
 * Only counts related skills the user actually tracks.
 */
export function calculateSynergyBonus(
  category: string,
  allInterests: readonly Interest[],
  effortAllocation: Readonly<Record<string, number>>
): number {
  const relatedSkills = SYNERGY_MAP[category] ?? {};

  let totalSynergyBonus = 0;
  for (const [relatedSkill, synergyStrength] of Object.entries(relatedSkills)) {
    const isTracked = allInterests.some((i) => i.category === relatedSkill);
    if (!isTracked) continue;

    const relatedEffort = clampEffort(effortAllocation[relatedSkill] ?? 0);
    totalSynergyBonus += (relatedEffort / 100) * synergyStrength;
  }

  return Math.min(MAX_SYNERGY_BONUS, totalSynergyBonus);
}

export function calculateSkillGrowth(
  interest: Interest,
  effort: number,
  timeframeWeeks: number,
  allInterests: readonly Interest[],
  effortAllocation: Readonly<Record<string, number>>
): SimulationResult {
  const safeEffort = clampEffort(effort);
  const currentLevel = clampLevel(interest.currentLevel);

  const baseGrowthRate = calculateBaseGrowthRate(currentLevel, safeEffort);
  const synergyBonus = calculateSynergyBonus(
    interest.category,
    allInterests,
    effortAllocation
  );
  const commitmentMultiplier = getCommitmentMultiplier(interest.intentLevel);
  const diminishingReturns = calculateDiminishingReturns(currentLevel);

  const totalGrowthRate =
    baseGrowthRate *
    commitmentMultiplier *
    diminishingReturns *
    (1 + synergyBonus);

  // `totalGrowthRate` is expressed per year; scale it to the window.
  const growthAmount = (totalGrowthRate * timeframeWeeks) / 52;
  const projectedLevel = Math.min(MAX_SKILL_LEVEL, currentLevel + growthAmount);

  // Growth achieved per unit of effort — the "is this worth it?" metric.
  const effortEfficiency = safeEffort > 0 ? growthAmount / (safeEffort / 100) : 0;

  return {
    projectedLevel: round1(projectedLevel),
    growthRate: round2(totalGrowthRate),
    synergyBonus: round2(synergyBonus),
    effortEfficiency: round2(effortEfficiency),
  };
}

/** Run the forecast for every tracked interest. */
export function runSimulation(
  interests: readonly Interest[],
  effortAllocation: Readonly<Record<string, number>>,
  timeframeWeeks: number
): ForecastedResults {
  const forecastedResults: ForecastedResults = {};

  for (const interest of interests) {
    forecastedResults[interest.category] = calculateSkillGrowth(
      interest,
      effortAllocation[interest.category] ?? 0,
      timeframeWeeks,
      interests,
      effortAllocation
    );
  }

  return forecastedResults;
}

/** Runtime guard for forecast payloads coming back from the cache or the DB. */
export function isSimulationResult(value: unknown): value is SimulationResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.projectedLevel === "number" &&
    typeof record.growthRate === "number" &&
    typeof record.synergyBonus === "number" &&
    typeof record.effortEfficiency === "number"
  );
}

/**
 * Narrow an untrusted JSON blob to `ForecastedResults`, dropping entries that
 * do not match. Cached/persisted payloads predate this type, so they can hold
 * anything.
 */
export function parseForecastedResults(value: unknown): ForecastedResults {
  if (typeof value !== "object" || value === null) return {};

  const parsed: ForecastedResults = {};
  for (const [category, result] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (isSimulationResult(result)) {
      parsed[category] = result;
    }
  }
  return parsed;
}
