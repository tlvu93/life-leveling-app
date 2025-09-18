"use client";

import { Interest, getSkillLevelName } from "@/types";

interface TradeOffAnalysisProps {
  effortAllocation: Record<string, number>;
  forecastedResults: Record<string, any>;
  interests: Interest[];
}

interface TradeOff {
  type:
    | "opportunity_cost"
    | "synergy_boost"
    | "diminishing_returns"
    | "balanced_growth";
  skill: string;
  impact: number;
  description: string;
  severity: "low" | "medium" | "high";
}

export default function TradeOffAnalysis({
  effortAllocation,
  forecastedResults,
  interests,
}: TradeOffAnalysisProps) {
  const calculateTradeOffs = (): TradeOff[] => {
    const tradeOffs: TradeOff[] = [];

    // Analyze effort allocation patterns
    const efforts = Object.entries(effortAllocation);
    const maxEffort = Math.max(...efforts.map(([_, effort]) => effort));
    const minEffort = Math.min(...efforts.map(([_, effort]) => effort));
    const avgEffort =
      efforts.reduce((sum, [_, effort]) => sum + effort, 0) / efforts.length;

    // Check for opportunity costs (high effort on one skill)
    efforts.forEach(([skill, effort]) => {
      if (effort > 40) {
        const otherSkills = efforts.filter(([s, _]) => s !== skill);
        const avgOtherEffort =
          otherSkills.reduce((sum, [_, e]) => sum + e, 0) / otherSkills.length;

        tradeOffs.push({
          type: "opportunity_cost",
          skill,
          impact: effort - avgOtherEffort,
          description: `High focus on ${skill} may limit growth in other areas`,
          severity: effort > 60 ? "high" : effort > 50 ? "medium" : "low",
        });
      }
    });

    // Check for synergy opportunities
    const synergies = getSynergyMap();
    interests.forEach((interest) => {
      const relatedSkills = synergies[interest.category] || {};
      Object.entries(relatedSkills).forEach(([relatedSkill, boost]) => {
        const relatedInterest = interests.find(
          (i) => i.category === relatedSkill
        );
        if (relatedInterest) {
          const effort1 = effortAllocation[interest.category] || 0;
          const effort2 = effortAllocation[relatedSkill] || 0;

          if (effort1 > 20 && effort2 > 20) {
            tradeOffs.push({
              type: "synergy_boost",
              skill: `${interest.category} + ${relatedSkill}`,
              impact: (boost * Math.min(effort1, effort2)) / 100,
              description: `${interest.category} and ${relatedSkill} boost each other`,
              severity: "low",
            });
          }
        }
      });
    });

    // Check for diminishing returns (high level + high effort)
    interests.forEach((interest) => {
      const effort = effortAllocation[interest.category] || 0;
      if (interest.currentLevel >= 3 && effort > 30) {
        tradeOffs.push({
          type: "diminishing_returns",
          skill: interest.category,
          impact: (interest.currentLevel - 2) * (effort / 100),
          description: `${interest.category} is already advanced - consider diversifying`,
          severity: interest.currentLevel === 4 ? "high" : "medium",
        });
      }
    });

    // Check for balanced growth
    const effortVariance = calculateVariance(
      efforts.map(([_, effort]) => effort)
    );
    if (effortVariance < 100) {
      // Low variance indicates balanced allocation
      tradeOffs.push({
        type: "balanced_growth",
        skill: "All Skills",
        impact: 1 - effortVariance / 100,
        description:
          "Balanced effort allocation promotes steady growth across all areas",
        severity: "low",
      });
    }

    return tradeOffs.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const getSynergyMap = (): Record<string, Record<string, number>> => {
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
  };

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  };

  const getTradeOffIcon = (type: TradeOff["type"]): string => {
    switch (type) {
      case "opportunity_cost":
        return "⚠️";
      case "synergy_boost":
        return "🔗";
      case "diminishing_returns":
        return "📉";
      case "balanced_growth":
        return "⚖️";
      default:
        return "📊";
    }
  };

  const getTradeOffColor = (severity: TradeOff["severity"]): string => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getTradeOffTextColor = (severity: TradeOff["severity"]): string => {
    switch (severity) {
      case "high":
        return "text-red-700";
      case "medium":
        return "text-yellow-700";
      case "low":
        return "text-green-700";
      default:
        return "text-gray-700";
    }
  };

  const tradeOffs = calculateTradeOffs();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          🎯 Trade-Off Analysis
        </h3>
        <div className="text-sm text-gray-500">{tradeOffs.length} insights</div>
      </div>

      <div className="space-y-4">
        {tradeOffs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Adjust your effort allocation to see trade-off analysis</p>
          </div>
        ) : (
          tradeOffs.map((tradeOff, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getTradeOffColor(
                tradeOff.severity
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{getTradeOffIcon(tradeOff.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-medium ${getTradeOffTextColor(
                        tradeOff.severity
                      )}`}
                    >
                      {tradeOff.skill}
                    </h4>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tradeOff.severity === "high"
                          ? "bg-red-100 text-red-600"
                          : tradeOff.severity === "medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {tradeOff.severity}
                    </div>
                  </div>
                  <p
                    className={`text-sm ${getTradeOffTextColor(
                      tradeOff.severity
                    )}`}
                  >
                    {tradeOff.description}
                  </p>
                  {tradeOff.impact > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Impact:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              tradeOff.severity === "high"
                                ? "bg-red-400"
                                : tradeOff.severity === "medium"
                                ? "bg-yellow-400"
                                : "bg-green-400"
                            }`}
                            style={{
                              width: `${Math.min(tradeOff.impact * 20, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">💡 Quick Tips</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Focus 40%+ effort on one skill for rapid improvement</span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>
              Balance effort across related skills for synergy bonuses
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>
              Advanced skills (Level 3+) grow slower but unlock new paths
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Equal allocation promotes steady, balanced growth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
