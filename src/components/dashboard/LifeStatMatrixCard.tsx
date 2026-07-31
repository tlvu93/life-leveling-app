"use client";

import React, { useState, useEffect, useCallback } from "react";
import ResponsiveLifeStatMatrix from "../ResponsiveLifeStatMatrix";
import TimeBasedMatrixComparison from "../TimeBasedMatrixComparison";
import { Interest, LifeStatMatrixData } from "@/types";
import { createLifeStatMatrixData } from "@/lib/chart-utils";
import {
  generateSampleActivityData,
  activityToRadarData,
  ActivityMatrixData,
  getActivityLevelLabel,
  addActivity,
  ACTIVITY_POINTS,
} from "@/lib/activity-system";
import { refreshMatrixData } from "@/app/actions/matrix-actions";

interface LifeStatMatrixCardProps {
  className?: string;
}

export default function LifeStatMatrixCard({
  className = "",
}: LifeStatMatrixCardProps) {
  const [matrixData, setMatrixData] = useState<LifeStatMatrixData | null>(null);
  const [activityData, setActivityData] = useState<ActivityMatrixData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"activity" | "skills">("activity");

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in demo mode
      const isDemoMode =
        localStorage.getItem("lifeleveling-demo-mode") === "true";

      if (isDemoMode) {
        // Generate sample activity data for demo
        const sampleActivityData = generateSampleActivityData();
        setActivityData(sampleActivityData);

        // Also create matrix data from activity data
        const radarData = activityToRadarData(sampleActivityData);
        setMatrixData({
          current: radarData,
          historical: [],
        });
      } else {
        // Try to refresh data using server action
        const result = await refreshMatrixData();

        if (result.success && result.data) {
          const interests: Interest[] = result.data;

          if (interests.length === 0) {
            // No interests yet, show sample data
            const sampleActivityData = generateSampleActivityData();
            setActivityData(sampleActivityData);
            const radarData = activityToRadarData(sampleActivityData);
            setMatrixData({
              current: radarData,
              historical: [],
            });
          } else {
            // Convert interests to matrix data (legacy support)
            const data = createLifeStatMatrixData(interests);
            setMatrixData(data);

            // For now, generate sample activity data
            // In a real app, this would fetch actual activity data
            const sampleActivityData = generateSampleActivityData();
            setActivityData(sampleActivityData);
          }
        } else {
          // Fallback to sample data for demo purposes
          const sampleActivityData = generateSampleActivityData();
          setActivityData(sampleActivityData);
          const radarData = activityToRadarData(sampleActivityData);
          setMatrixData({
            current: radarData,
            historical: [],
          });
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback to sample data on error
      const sampleActivityData = generateSampleActivityData();
      setActivityData(sampleActivityData);
      const radarData = activityToRadarData(sampleActivityData);
      setMatrixData({
        current: radarData,
        historical: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
    // In a real app, this could open a detailed skill view or edit modal
    console.log("Clicked skill:", skill);
  };

  if (loading) {
    return (
      <div
        className={`bg-card rounded-lg shadow-md p-6 border border-border ${className}`}
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">
          📊 Your LifeStat Matrix
        </h2>
        <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading your matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-card rounded-lg shadow-md p-6 border border-border ${className}`}
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">
          📊 Your LifeStat Matrix
        </h2>
        <div className="h-64 bg-destructive/10 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load matrix</p>
            <button
              type="button"
              onClick={() => void fetchUserData()}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <div
        className={`bg-card rounded-lg shadow-md p-6 border border-border ${className}`}
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">
          📊 Your LifeStat Matrix
        </h2>
        <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No data available</p>
            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Complete onboarding to see your matrix
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-card rounded-lg shadow-md overflow-hidden border border-border ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              📊 Your LifeStat Matrix
            </h2>
            <p className="text-sm text-muted-foreground">
              {viewMode === "activity"
                ? "Your current skill levels across your chosen interests. Gray areas show your previous levels."
                : "Track your recent effort and goal completion over the last 2 weeks"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("activity")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "activity"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode("skills")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "skills"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Compare
              </button>
            </div>

            {/* View Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">View:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setShowHistorical(false)}
                  className={`px-2 py-1 text-xs transition-colors ${
                    !showHistorical
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Overlay
                </button>
                <button
                  onClick={() => setShowHistorical(true)}
                  className={`px-2 py-1 text-xs transition-colors ${
                    showHistorical
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Side by Side
                </button>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchUserData}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
              aria-label="Refresh"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Activity Stats */}
        {viewMode === "activity" && activityData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {activityData.categories.reduce(
                  (sum, cat) =>
                    sum +
                    cat.activities.filter((a) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.completedAt >= weekAgo;
                    }).length,
                  0
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Levels Gained
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activityData.categories.filter((cat) => cat.level > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Skills Improved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(activityData.averageActivity / 100).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                Average Improvement
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Compare with:
              </div>
              <div className="flex gap-1">
                <button className="px-2 py-1 text-xs bg-muted rounded">
                  1 Week Ago
                </button>
                <button className="px-2 py-1 text-xs bg-muted rounded">
                  1 Month Ago
                </button>
                <button className="px-2 py-1 text-xs bg-muted rounded">
                  1 Year Ago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Matrix Visualization */}
      <div className="px-6 pb-6">
        {viewMode === "activity" ? (
          <ResponsiveLifeStatMatrix
            data={matrixData}
            onSkillClick={handleSkillClick}
            showHistorical={showHistorical}
          />
        ) : (
          <TimeBasedMatrixComparison
            data={matrixData}
            onSkillClick={handleSkillClick}
          />
        )}
      </div>

      {/* Selected Skill Info */}
      {selectedSkill && activityData && (
        <div className="px-6 pb-6">
          {(() => {
            const categoryData = activityData.categories.find(
              (cat) => cat.category === selectedSkill
            );
            if (!categoryData) return null;

            return (
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-primary">{selectedSkill}</h4>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    {getActivityLevelLabel(categoryData.level)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-primary">
                      {categoryData.recentPoints}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Recent Points
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-primary">
                      {categoryData.streak} days
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current Streak
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-primary">
                      {categoryData.activities.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Activities
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      // Simulate completing a goal
                      if (activityData) {
                        const updatedData = addActivity(
                          activityData,
                          selectedSkill,
                          "goal_completed",
                          "Completed practice goal"
                        );
                        setActivityData(updatedData);
                        const radarData = activityToRadarData(updatedData);
                        setMatrixData({
                          current: radarData,
                          historical: matrixData?.historical || [],
                        });
                      }
                    }}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors mr-2"
                  >
                    + Complete Goal ({ACTIVITY_POINTS.goal_completed} pts)
                  </button>
                  <button
                    onClick={() => {
                      // Simulate a practice session
                      if (activityData) {
                        const updatedData = addActivity(
                          activityData,
                          selectedSkill,
                          "practice_session",
                          "Practice session completed"
                        );
                        setActivityData(updatedData);
                        const radarData = activityToRadarData(updatedData);
                        setMatrixData({
                          current: radarData,
                          historical: matrixData?.historical || [],
                        });
                      }
                    }}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                  >
                    + Practice Session ({ACTIVITY_POINTS.practice_session} pts)
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-muted/50 px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => (window.location.href = "/adventure")}
            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
          >
            📝 Weekly Check-in
          </button>
          <button
            onClick={() => (window.location.href = "/adventure")}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
          >
            🎯 Set New Goal
          </button>
          <button
            onClick={() => (window.location.href = "/architect")}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            🔮 Explore Paths
          </button>
          <button
            onClick={() => (window.location.href = "/retrospectives")}
            className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full hover:bg-purple-600 transition-colors"
          >
            📈 View Progress
          </button>
        </div>
      </div>
    </div>
  );
}
