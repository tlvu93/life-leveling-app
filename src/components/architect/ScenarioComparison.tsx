"use client";

import { useState } from "react";
import { SimulationScenario, Interest } from "@/types";
import ResponsiveLifeStatMatrix from "@/components/ResponsiveLifeStatMatrix";

interface ScenarioComparisonProps {
  scenarios: SimulationScenario[];
  userInterests: Interest[];
  onClose: () => void;
}

export default function ScenarioComparison({
  scenarios,
  userInterests,
  onClose,
}: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<
    "growth" | "effort" | "efficiency"
  >("growth");

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios((prev) => {
      if (prev.includes(scenarioId)) {
        return prev.filter((id) => id !== scenarioId);
      } else if (prev.length < 3) {
        // Limit to 3 scenarios for clarity
        return [...prev, scenarioId];
      }
      return prev;
    });
  };

  const getScenarioData = (scenario: SimulationScenario) => {
    return userInterests.map((interest) => {
      const forecast = scenario.forecastedResults[interest.category];
      let value = interest.currentLevel;

      if (forecast) {
        switch (comparisonMetric) {
          case "growth":
            value = forecast.projectedLevel - interest.currentLevel;
            break;
          case "effort":
            value = scenario.effortAllocation[interest.category] || 0;
            break;
          case "efficiency":
            value = forecast.effortEfficiency || 0;
            break;
        }
      }

      return {
        skill: interest.category,
        value: Math.max(0, value),
        maxValue: comparisonMetric === "effort" ? 100 : 4,
        color: getScenarioColor(scenario.id),
      };
    });
  };

  const getScenarioColor = (scenarioId: string) => {
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    const index = selectedScenarios.indexOf(scenarioId);
    return colors[index] || "#6b7280";
  };

  const calculateScenarioMetrics = (scenario: SimulationScenario) => {
    const totalGrowth = userInterests.reduce((sum, interest) => {
      const forecast = scenario.forecastedResults[interest.category];
      return (
        sum + (forecast ? forecast.projectedLevel - interest.currentLevel : 0)
      );
    }, 0);

    const totalEffort = Object.values(scenario.effortAllocation).reduce(
      (sum, effort) => sum + effort,
      0
    );

    const avgEfficiency =
      userInterests.reduce((sum, interest) => {
        const forecast = scenario.forecastedResults[interest.category];
        return sum + (forecast ? forecast.effortEfficiency : 0);
      }, 0) / userInterests.length;

    return {
      totalGrowth: totalGrowth.toFixed(1),
      totalEffort,
      avgEfficiency: avgEfficiency.toFixed(2),
      timeframe: scenario.timeframeWeeks,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Scenario Comparison
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Compare up to 3 scenarios to see which path works best for you
          </p>
        </div>

        <div className="p-6">
          {/* Scenario Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Select Scenarios to Compare
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedScenarios.includes(scenario.id)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleScenario(scenario.id)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {scenario.scenarioName}
                    </h4>
                    <div
                      className={`w-4 h-4 rounded-full ${
                        selectedScenarios.includes(scenario.id)
                          ? "bg-purple-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {scenario.timeframeWeeks} weeks
                  </p>
                </div>
              ))}
            </div>
          </div>

          {selectedScenarios.length > 0 && (
            <>
              {/* Comparison Metric Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Comparison Metric
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setComparisonMetric("growth")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      comparisonMetric === "growth"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Growth Potential
                  </button>
                  <button
                    onClick={() => setComparisonMetric("effort")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      comparisonMetric === "effort"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Effort Allocation
                  </button>
                  <button
                    onClick={() => setComparisonMetric("efficiency")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      comparisonMetric === "efficiency"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Efficiency
                  </button>
                </div>
              </div>

              {/* Visual Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Chart Comparison */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Visual Comparison
                  </h4>
                  <div className="relative">
                    {selectedScenarios.map((scenarioId, index) => {
                      const scenario = scenarios.find(
                        (s) => s.id === scenarioId
                      );
                      if (!scenario) return null;

                      return (
                        <div
                          key={scenarioId}
                          className={`${index > 0 ? "absolute inset-0" : ""}`}
                          style={{ opacity: index > 0 ? 0.6 : 1 }}
                        >
                          <ResponsiveLifeStatMatrix
                            data={{ current: getScenarioData(scenario) }}
                            showHistorical={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics Comparison */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Key Metrics
                  </h4>
                  <div className="space-y-4">
                    {selectedScenarios.map((scenarioId) => {
                      const scenario = scenarios.find(
                        (s) => s.id === scenarioId
                      );
                      if (!scenario) return null;

                      const metrics = calculateScenarioMetrics(scenario);

                      return (
                        <div
                          key={scenarioId}
                          className="p-3 bg-white rounded-lg border"
                          style={{ borderColor: getScenarioColor(scenarioId) }}
                        >
                          <h5 className="font-medium text-gray-900 mb-2">
                            {scenario.scenarioName}
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">
                                Total Growth:
                              </span>
                              <span className="font-medium ml-1">
                                +{metrics.totalGrowth}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Timeframe:</span>
                              <span className="font-medium ml-1">
                                {metrics.timeframe}w
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Effort:</span>
                              <span className="font-medium ml-1">
                                {metrics.totalEffort}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Efficiency:</span>
                              <span className="font-medium ml-1">
                                {metrics.avgEfficiency}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
                <div className="flex flex-wrap gap-4">
                  {selectedScenarios.map((scenarioId) => {
                    const scenario = scenarios.find((s) => s.id === scenarioId);
                    if (!scenario) return null;

                    return (
                      <div key={scenarioId} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: getScenarioColor(scenarioId),
                          }}
                        />
                        <span className="text-sm text-gray-700">
                          {scenario.scenarioName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {selectedScenarios.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Select scenarios above to start comparing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
