import { describe, expect, it } from "vitest";
import {
  CommitmentLevel,
  SkillLevel,
  type Interest,
  type SimulationResult,
} from "@/types";
import {
  MAX_SYNERGY_BONUS,
  calculateBaseGrowthRate,
  calculateDiminishingReturns,
  calculateSkillGrowth,
  calculateSynergyBonus,
  getCommitmentMultiplier,
  isSimulationResult,
  parseForecastedResults,
  runSimulation,
} from "@/lib/simulation";

function makeInterest(
  category: string,
  currentLevel: SkillLevel = SkillLevel.NOVICE,
  intentLevel: CommitmentLevel = CommitmentLevel.AVERAGE
): Interest {
  return {
    id: `interest-${category}`,
    userId: "user-1",
    category,
    currentLevel,
    intentLevel,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

describe("getCommitmentMultiplier", () => {
  it("scales with commitment", () => {
    expect(getCommitmentMultiplier(CommitmentLevel.CASUAL)).toBe(0.8);
    expect(getCommitmentMultiplier(CommitmentLevel.AVERAGE)).toBe(1.0);
    expect(getCommitmentMultiplier(CommitmentLevel.INVESTED)).toBe(1.2);
    expect(getCommitmentMultiplier(CommitmentLevel.COMPETITIVE)).toBe(1.4);
  });

  it("falls back to 1.0 for values that are not a commitment level", () => {
    expect(getCommitmentMultiplier("obsessive")).toBe(1.0);
  });
});

describe("calculateBaseGrowthRate", () => {
  it("rewards lower skill levels more for the same effort", () => {
    const novice = calculateBaseGrowthRate(SkillLevel.NOVICE, 50);
    const expert = calculateBaseGrowthRate(SkillLevel.EXPERT, 50);
    expect(novice).toBeGreaterThan(expert);
  });

  it("saturates once effort passes ~83%", () => {
    const at90 = calculateBaseGrowthRate(SkillLevel.NOVICE, 90);
    const at100 = calculateBaseGrowthRate(SkillLevel.NOVICE, 100);
    expect(at90).toBe(at100);
  });

  it("clamps out-of-range effort instead of producing NaN", () => {
    expect(calculateBaseGrowthRate(SkillLevel.NOVICE, -20)).toBe(0);
    expect(calculateBaseGrowthRate(SkillLevel.NOVICE, Number.NaN)).toBe(0);
  });

  it("clamps out-of-range levels instead of producing NaN", () => {
    // A level of 9 is not a `SkillLevel`, but it can arrive from the database.
    expect(
      calculateBaseGrowthRate(9 as unknown as SkillLevel, 100)
    ).not.toBeNaN();
    expect(calculateDiminishingReturns(0 as unknown as SkillLevel)).toBe(1.0);
  });
});

describe("calculateSynergyBonus", () => {
  const interests = [
    makeInterest("Math"),
    makeInterest("Technical"),
    makeInterest("Science"),
  ];

  it("credits effort spent on related tracked skills", () => {
    // Math gains 0.3 from Technical and 0.2 from Science.
    const bonus = calculateSynergyBonus("Math", interests, {
      Technical: 100,
      Science: 100,
    });
    expect(bonus).toBeCloseTo(0.5, 10);
  });

  it("ignores related skills the user does not track", () => {
    const bonus = calculateSynergyBonus("Math", [makeInterest("Math")], {
      Technical: 100,
      Science: 100,
    });
    expect(bonus).toBe(0);
  });

  it("returns zero for a category with no synergies", () => {
    expect(
      calculateSynergyBonus("Underwater Basket Weaving", interests, {
        Technical: 100,
      })
    ).toBe(0);
  });

  it("caps the combined bonus", () => {
    const wide = [
      makeInterest("Creativity"),
      makeInterest("Arts"),
      makeInterest("Music"),
      makeInterest("Technical"),
    ];
    const bonus = calculateSynergyBonus("Creativity", wide, {
      Arts: 100,
      Music: 100,
      Technical: 100,
    });
    expect(bonus).toBe(MAX_SYNERGY_BONUS);
  });
});

describe("calculateSkillGrowth", () => {
  it("never projects past the maximum skill level", () => {
    const expert = makeInterest(
      "Math",
      SkillLevel.EXPERT,
      CommitmentLevel.COMPETITIVE
    );
    const result = calculateSkillGrowth(expert, 100, 52, [expert], {
      Math: 100,
    });
    expect(result.projectedLevel).toBeLessThanOrEqual(SkillLevel.EXPERT);
  });

  it("never projects below the current level", () => {
    const interest = makeInterest("Math", SkillLevel.INTERMEDIATE);
    const result = calculateSkillGrowth(interest, 0, 12, [interest], {
      Math: 0,
    });
    expect(result.projectedLevel).toBeGreaterThanOrEqual(
      SkillLevel.INTERMEDIATE
    );
  });

  it("reports zero efficiency when no effort is allocated", () => {
    const interest = makeInterest("Math");
    const result = calculateSkillGrowth(interest, 0, 12, [interest], {
      Math: 0,
    });
    expect(result.effortEfficiency).toBe(0);
    expect(result.growthRate).toBe(0);
  });

  it("grows more over a longer timeframe", () => {
    const interest = makeInterest("Math");
    const short = calculateSkillGrowth(interest, 50, 4, [interest], {
      Math: 50,
    });
    const long = calculateSkillGrowth(interest, 50, 52, [interest], {
      Math: 50,
    });
    expect(long.projectedLevel).toBeGreaterThan(short.projectedLevel);
  });

  it("grows more at a higher commitment level", () => {
    const casual = makeInterest("Math", SkillLevel.NOVICE, CommitmentLevel.CASUAL);
    const competitive = makeInterest(
      "Math",
      SkillLevel.NOVICE,
      CommitmentLevel.COMPETITIVE
    );
    const casualResult = calculateSkillGrowth(casual, 60, 52, [casual], {
      Math: 60,
    });
    const competitiveResult = calculateSkillGrowth(
      competitive,
      60,
      52,
      [competitive],
      { Math: 60 }
    );
    expect(competitiveResult.projectedLevel).toBeGreaterThan(
      casualResult.projectedLevel
    );
  });

  it("returns finite numbers for every field", () => {
    const interest = makeInterest("Math");
    const result = calculateSkillGrowth(interest, 33, 8, [interest], {
      Math: 33,
    });
    for (const value of Object.values(result)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe("runSimulation", () => {
  const interests = [
    makeInterest("Math", SkillLevel.NOVICE),
    makeInterest("Technical", SkillLevel.INTERMEDIATE),
  ];

  it("produces one entry per tracked interest", () => {
    const results = runSimulation(interests, { Math: 60, Technical: 40 }, 12);
    expect(Object.keys(results).sort()).toEqual(["Math", "Technical"]);
  });

  it("treats a missing allocation as zero effort", () => {
    const results = runSimulation(interests, { Math: 100 }, 12);
    expect(results.Technical?.effortEfficiency).toBe(0);
  });

  it("is deterministic", () => {
    const allocation = { Math: 60, Technical: 40 };
    expect(runSimulation(interests, allocation, 12)).toEqual(
      runSimulation(interests, allocation, 12)
    );
  });

  it("returns an empty forecast for a user with no interests", () => {
    expect(runSimulation([], {}, 12)).toEqual({});
  });
});

describe("parseForecastedResults", () => {
  const valid: SimulationResult = {
    projectedLevel: 2.1,
    growthRate: 0.5,
    synergyBonus: 0.1,
    effortEfficiency: 0.2,
  };

  it("keeps well-formed entries", () => {
    expect(parseForecastedResults({ Math: valid })).toEqual({ Math: valid });
  });

  it("drops entries that are not simulation results", () => {
    expect(
      parseForecastedResults({ Math: valid, Legacy: { projectedLevel: 2 } })
    ).toEqual({ Math: valid });
  });

  it("tolerates non-object input", () => {
    expect(parseForecastedResults(null)).toEqual({});
    expect(parseForecastedResults("not json")).toEqual({});
    expect(parseForecastedResults(undefined)).toEqual({});
  });

  it("recognises a valid result", () => {
    expect(isSimulationResult(valid)).toBe(true);
    expect(isSimulationResult({ projectedLevel: "2" })).toBe(false);
  });
});
