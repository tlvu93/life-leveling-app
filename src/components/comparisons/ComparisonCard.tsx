"use client";

import React from "react";
import { CohortComparison, CommitmentLevel } from "@/types";

interface ComparisonCardProps {
  comparison: CohortComparison;
  commitmentDescription: string;
}

export function ComparisonCard({
  comparison,
  commitmentDescription,
}: ComparisonCardProps) {
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90)
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percentile >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    if (percentile >= 50)
      return "text-indigo-600 bg-indigo-50 border-indigo-200";
    if (percentile >= 25)
      return "text-purple-600 bg-purple-50 border-purple-200";
    return "text-pink-600 bg-pink-50 border-pink-200";
  };

  const getPercentileIcon = (percentile: number): JSX.Element => {
    if (percentile >= 90) {
      return (
        <svg
          className="w-6 h-6 text-emerald-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (percentile >= 75) {
      return (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (percentile >= 50) {
      return (
        <svg
          className="w-6 h-6 text-indigo-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (percentile >= 25) {
      return (
        <svg
          className="w-6 h-6 text-purple-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 4.586l2.293 2.293a1 1 0 001.414 1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-6 h-6 text-pink-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getCommitmentBadgeColor = (level: CommitmentLevel): string => {
    switch (level) {
      case CommitmentLevel.CASUAL:
        return "bg-green-100 text-green-800";
      case CommitmentLevel.AVERAGE:
        return "bg-blue-100 text-blue-800";
      case CommitmentLevel.INVESTED:
        return "bg-purple-100 text-purple-800";
      case CommitmentLevel.COMPETITIVE:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCommitmentLevel = (level: CommitmentLevel): string => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getProgressBarWidth = (percentile: number): string => {
    return `${Math.max(percentile, 5)}%`; // Minimum 5% for visibility
  };

  const getProgressBarColor = (percentile: number): string => {
    if (percentile >= 90) return "bg-emerald-500";
    if (percentile >= 75) return "bg-blue-500";
    if (percentile >= 50) return "bg-indigo-500";
    if (percentile >= 25) return "bg-purple-500";
    return "bg-pink-500";
  };

  return (
    <div
      className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${getPercentileColor(
        comparison.percentile
      )}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getPercentileIcon(comparison.percentile)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {comparison.interest}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getCommitmentBadgeColor(
                  comparison.intentLevel
                )}`}
              >
                {formatCommitmentLevel(comparison.intentLevel)}
              </span>
              <span className="text-sm text-gray-600">
                Ages {comparison.ageRange.min}-{comparison.ageRange.max}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {comparison.percentile}th
          </div>
          <div className="text-sm text-gray-600">percentile</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Your position
          </span>
          <span className="text-sm text-gray-600">
            {comparison.cohortSize} peers
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(
              comparison.percentile
            )}`}
            style={{ width: getProgressBarWidth(comparison.percentile) }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white mix-blend-difference">
              {comparison.percentile}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/50 rounded-lg p-4 mb-4">
        <p className="text-gray-800 font-medium leading-relaxed">
          {comparison.encouragingMessage}
        </p>
      </div>

      <div className="text-sm text-gray-600">
        <p>{commitmentDescription}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Compared with {comparison.cohortSize} similar learners</span>
          <span>Updated recently</span>
        </div>
      </div>
    </div>
  );
}
