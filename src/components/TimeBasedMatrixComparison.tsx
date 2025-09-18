"use client";

import React, { useState, useEffect } from "react";
import ResponsiveLifeStatMatrix from "./ResponsiveLifeStatMatrix";
import SkillTooltip from "./SkillTooltip";
import { LifeStatMatrixData, RadarChartData } from "@/types";

interface TimeBasedMatrixComparisonProps {
  data: LifeStatMatrixData;
  className?: string;
  onSkillClick?: (skill: string) => void;
}

type TimeFrame = "week" | "month" | "year";

interface TooltipState {
  visible: boolean;
  skill: RadarChartData | null;
  historicalValue?: number;
  position: { x: number; y: number };
}

export default function TimeBasedMatrixComparison({
  data,
  className = "",
  onSkillClick,
}: TimeBasedMatrixComparisonProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeFrame>("month");
  const [comparisonMode, setComparisonMode] = useState<
    "overlay" | "side-by-side"
  >("overlay");
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    skill: null,
    position: { x: 0, y: 0 },
  });

  // Get historical data for the selected timeframe
  const getHistoricalDataForTimeframe = (
    timeframe: TimeFrame
  ): RadarChartData[] | null => {
    if (!data.historical || data.historical.length === 0) return null;

    const now = new Date();
    const timeframeMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const targetDate = new Date(now.getTime() - timeframeMs);

    // Find the closest historical data point to the target date
    let closestEntry = data.historical[0];
    let closestDiff = Math.abs(
      closestEntry.date.getTime() - targetDate.getTime()
    );

    for (const entry of data.historical) {
      const diff = Math.abs(entry.date.getTime() - targetDate.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestEntry = entry;
      }
    }

    return closestEntry.data;
  };

  const historicalData = getHistoricalDataForTimeframe(selectedTimeframe);

  // Create comparison data for side-by-side view
  const comparisonData: LifeStatMatrixData = {
    current: data.current,
    historical: historicalData
      ? [{ date: new Date(), data: historicalData }]
      : undefined,
  };

  const handleSkillHover = (skill: string, event: React.MouseEvent) => {
    const skillData = data.current.find((s) => s.skill === skill);
    const historicalValue = historicalData?.find(
      (s) => s.skill === skill
    )?.value;

    if (skillData) {
      setTooltip({
        visible: true,
        skill: skillData,
        historicalValue,
        position: { x: event.clientX, y: event.clientY },
      });
    }
  };

  const handleSkillClick = (skill: string) => {
    onSkillClick?.(skill);
  };

  const closeTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Calculate improvement statistics
  const improvements = data.current
    .map((current) => {
      const historical = historicalData?.find((h) => h.skill === current.skill);
      const improvement = historical ? current.value - historical.value : 0;
      return {
        skill: current.skill,
        improvement,
        current: current.value,
        historical: historical?.value || current.value,
      };
    })
    .sort((a, b) => b.improvement - a.improvement);

  const totalImprovement = improvements.reduce(
    (sum, item) => sum + Math.max(0, item.improvement),
    0
  );
  const improvedSkills = improvements.filter(
    (item) => item.improvement > 0
  ).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Timeframe Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Compare with:
            </span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["week", "month", "year"] as TimeFrame[]).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    selectedTimeframe === timeframe
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {timeframe === "week"
                    ? "1 Week Ago"
                    : timeframe === "month"
                    ? "1 Month Ago"
                    : "1 Year Ago"}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">View:</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setComparisonMode("overlay")}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  comparisonMode === "overlay"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Overlay
              </button>
              <button
                onClick={() => setComparisonMode("side-by-side")}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  comparisonMode === "side-by-side"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Side by Side
              </button>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        {historicalData && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalImprovement}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Levels Gained
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {improvedSkills}
                </div>
                <div className="text-sm text-muted-foreground">
                  Skills Improved
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((totalImprovement / data.current.length) * 10) /
                    10}
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Improvement
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Matrix Visualization */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {comparisonMode === "overlay" ? (
          <div className="p-6">
            <ResponsiveLifeStatMatrix
              data={comparisonData}
              onSkillClick={handleSkillClick}
              showHistorical={!!historicalData}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Current */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Current Skills
              </h3>
              <ResponsiveLifeStatMatrix
                data={{ current: data.current }}
                onSkillClick={handleSkillClick}
                showHistorical={false}
              />
            </div>

            {/* Historical */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                {selectedTimeframe === "week"
                  ? "1 Week Ago"
                  : selectedTimeframe === "month"
                  ? "1 Month Ago"
                  : "1 Year Ago"}
              </h3>
              {historicalData ? (
                <ResponsiveLifeStatMatrix
                  data={{ current: historicalData }}
                  onSkillClick={handleSkillClick}
                  showHistorical={false}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                  No historical data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Improvement Breakdown */}
      {historicalData && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Skill Improvements (
            {selectedTimeframe === "week"
              ? "Past Week"
              : selectedTimeframe === "month"
              ? "Past Month"
              : "Past Year"}
            )
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {improvements.map((item) => (
              <div
                key={item.skill}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  item.improvement > 0
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : item.improvement < 0
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                    : "border-border bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => handleSkillClick(item.skill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    {item.skill}
                  </span>
                  {item.improvement !== 0 && (
                    <span
                      className={`text-sm font-bold ${
                        item.improvement > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.improvement > 0 ? "+" : ""}
                      {item.improvement}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.historical} → {item.current}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tooltip */}
      <SkillTooltip
        skill={tooltip.skill!}
        historicalValue={tooltip.historicalValue}
        position={tooltip.position}
        visible={tooltip.visible}
        onClose={closeTooltip}
      />
    </div>
  );
}
