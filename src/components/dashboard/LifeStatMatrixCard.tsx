"use client";

import React, { useState, useEffect } from "react";
import ResponsiveLifeStatMatrix from "../ResponsiveLifeStatMatrix";
import TimeBasedMatrixComparison from "../TimeBasedMatrixComparison";
import { Interest, LifeStatMatrixData } from "@/types";
import {
  createLifeStatMatrixData,
  generateSampleLifeStatData,
} from "@/lib/chart-utils";
import { refreshMatrixData } from "@/app/actions/matrix-actions";

interface LifeStatMatrixCardProps {
  className?: string;
}

export default function LifeStatMatrixCard({
  className = "",
}: LifeStatMatrixCardProps) {
  const [matrixData, setMatrixData] = useState<LifeStatMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"basic" | "advanced">("basic");

  useEffect(() => {
    fetchUserInterests();
  }, []);

  const fetchUserInterests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to refresh data using server action
      const result = await refreshMatrixData();

      if (result.success && result.data) {
        const interests: Interest[] = result.data;

        if (interests.length === 0) {
          // No interests yet, show sample data
          setMatrixData(generateSampleLifeStatData());
        } else {
          // Convert interests to matrix data
          const data = createLifeStatMatrixData(interests);
          setMatrixData(data);
        }
      } else {
        // Fallback to sample data for demo purposes
        setMatrixData(generateSampleLifeStatData());
      }
    } catch (err) {
      console.error("Error fetching interests:", err);
      // Fallback to sample data on error
      setMatrixData(generateSampleLifeStatData());
    } finally {
      setLoading(false);
    }
  };

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
    // In a real app, this could open a detailed skill view or edit modal
    console.log("Clicked skill:", skill);
  };

  const toggleHistoricalView = () => {
    setShowHistorical(!showHistorical);
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
              onClick={fetchUserInterests}
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
          <h2 className="text-xl font-semibold text-foreground">
            📊 Your LifeStat Matrix
          </h2>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("basic")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "basic"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setViewMode("advanced")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "advanced"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Advanced
              </button>
            </div>

            {/* Historical Toggle (for basic view) */}
            {viewMode === "basic" &&
              matrixData.historical &&
              matrixData.historical.length > 0 && (
                <button
                  onClick={toggleHistoricalView}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    showHistorical
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {showHistorical ? "Hide History" : "Show History"}
                </button>
              )}

            {/* Refresh Button */}
            <button
              onClick={fetchUserInterests}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
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
      </div>

      {/* Matrix Visualization */}
      <div className="px-6 pb-6">
        {viewMode === "basic" ? (
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

      {/* Selected Skill Info (only for basic view) */}
      {viewMode === "basic" && selectedSkill && (
        <div className="px-6 pb-6">
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>{selectedSkill}</strong> - Click to view detailed progress
              and set goals
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-muted/50 px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => (window.location.href = "/adventure")}
            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
          >
            Set Goals
          </button>
          <button
            onClick={() => (window.location.href = "/architect")}
            className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-secondary/90 transition-colors"
          >
            Simulate Growth
          </button>
          <button
            onClick={() => (window.location.href = "/profile")}
            className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full hover:bg-accent/90 transition-colors"
          >
            Update Skills
          </button>
        </div>
      </div>
    </div>
  );
}
