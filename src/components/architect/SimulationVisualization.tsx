"use client";

import { useEffect, useRef, useState } from "react";
import { Interest, SkillLevel, RadarChartData } from "@/types";
import ResponsiveLifeStatMatrix from "@/components/ResponsiveLifeStatMatrix";

interface SimulationVisualizationProps {
  currentInterests: Interest[];
  effortAllocation: Record<string, number>;
  forecastedResults: Record<string, unknown>;
  timeframeWeeks: number;
}

export default function SimulationVisualization({
  currentInterests,
  effortAllocation,
  forecastedResults,
  timeframeWeeks,
}: SimulationVisualizationProps) {
  const [currentData, setCurrentData] = useState<RadarChartData[]>([]);
  const [forecastedData, setForecastedData] = useState<RadarChartData[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    // Convert current interests to radar chart data
    const current = currentInterests.map((interest) => ({
      skill: interest.category,
      value: interest.currentLevel,
      maxValue: 4,
      color: "#8b5cf6",
    }));
    setCurrentData(current);

    // Convert forecasted results to radar chart data
    if (Object.keys(forecastedResults).length > 0) {
      const forecasted = currentInterests.map((interest) => {
        const forecast = forecastedResults[interest.category];
        return {
          skill: interest.category,
          value: forecast?.projectedLevel || interest.currentLevel,
          maxValue: 4,
          color: "#10b981",
        };
      });
      setForecastedData(forecasted);
    }
  }, [currentInterests, forecastedResults]);

  const calculateGrowthMetrics = () => {
    if (Object.keys(forecastedResults).length === 0) return null;

    const metrics = {
      totalGrowth: 0,
      averageGrowth: 0,
      skillsImproved: 0,
      maxGrowth: 0,
      maxGrowthSkill: "",
    };

    currentInterests.forEach((interest) => {
      const forecast = forecastedResults[interest.category];
      if (forecast) {
        const growth = forecast.projectedLevel - interest.currentLevel;
        metrics.totalGrowth += growth;

        if (growth > 0) {
          metrics.skillsImproved++;
        }

        if (growth > metrics.maxGrowth) {
          metrics.maxGrowth = growth;
          metrics.maxGrowthSkill = interest.category;
        }
      }
    });

    metrics.averageGrowth = metrics.totalGrowth / currentInterests.length;

    return metrics;
  };

  const metrics = calculateGrowthMetrics();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">📊 Growth Forecast</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showComparison
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {showComparison ? "Hide Comparison" : "Show Comparison"}
          </button>
        </div>
      </div>

      {/* Radar Chart Visualization */}
      <div className="mb-6">
        <div className="relative">
          <ResponsiveLifeStatMatrix
            data={{
              current:
                showComparison && forecastedData.length > 0
                  ? forecastedData
                  : currentData,
              historical:
                showComparison && forecastedData.length > 0
                  ? [
                      {
                        date: new Date(),
                        data: currentData,
                      },
                    ]
                  : undefined,
            }}
            showHistorical={showComparison && forecastedData.length > 0}
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {showComparison ? "Current" : "Your Skills"}
            </span>
          </div>
          {showComparison && forecastedData.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Forecasted ({timeframeWeeks} weeks)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Growth Metrics */}
      {metrics && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Growth Projection</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                +{metrics.totalGrowth.toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Total Growth</div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.skillsImproved}
              </div>
              <div className="text-sm text-blue-700">Skills Improved</div>
            </div>
          </div>

          {metrics.maxGrowthSkill && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">
                Biggest Growth: {metrics.maxGrowthSkill}
              </div>
              <div className="text-lg font-bold text-purple-600">
                +{metrics.maxGrowth.toFixed(1)} levels
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            * Projections based on effort allocation and skill synergies
          </div>
        </div>
      )}

      {/* Effort Distribution Visualization */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">
          Effort Distribution
        </h4>
        <div className="space-y-2">
          {currentInterests.map((interest) => {
            const effort = effortAllocation[interest.category] || 0;
            return (
              <div key={interest.id} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-600 truncate">
                  {interest.category}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${effort}%` }}
                  />
                </div>
                <div className="w-10 text-sm text-gray-600 text-right">
                  {effort}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {Object.keys(forecastedResults).length === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            Run a simulation to see growth projections
          </p>
        </div>
      )}
    </div>
  );
}
