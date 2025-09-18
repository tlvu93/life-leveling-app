"use client";

import React from "react";
import { RadarChartData, SkillLevel } from "@/types";
import { formatSkillLevel, getSkillLevelDescription } from "@/lib/chart-utils";

interface SkillTooltipProps {
  skill: RadarChartData;
  historicalValue?: number;
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
}

export default function SkillTooltip({
  skill,
  historicalValue,
  position,
  visible,
  onClose,
}: SkillTooltipProps) {
  if (!visible) return null;

  const improvement = historicalValue ? skill.value - historicalValue : 0;
  const improvementText =
    improvement > 0 ? "+" + improvement : improvement.toString();
  const improvementColor =
    improvement > 0
      ? "text-green-600 dark:text-green-400"
      : improvement < 0
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.max(position.y - 100, 10),
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Close tooltip"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Skill name */}
      <h3 className="font-semibold text-foreground mb-2 pr-6">{skill.skill}</h3>

      {/* Current level */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Current Level</span>
          <span className="font-medium text-foreground">
            {formatSkillLevel(skill.value)}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: skill.maxValue }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < skill.value ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Historical comparison */}
      {historicalValue !== undefined && (
        <div className="mb-3 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">
              Previous Level
            </span>
            <span className="text-sm text-foreground">
              {formatSkillLevel(historicalValue)}
            </span>
          </div>
          {improvement !== 0 && (
            <div className={`text-sm font-medium ${improvementColor}`}>
              {improvement > 0 ? "↗" : "↘"} {improvementText} level
              {Math.abs(improvement) !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">
        {getSkillLevelDescription(skill.value)}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">
          Set Goal
        </button>
        <button className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-muted/80 transition-colors">
          View History
        </button>
      </div>
    </div>
  );
}
