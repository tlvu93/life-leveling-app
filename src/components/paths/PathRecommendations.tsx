"use client";

import React, { useState, useEffect } from "react";
import { PathRecommendation } from "@/lib/path-management";
import { getSkillLevelName, getCommitmentLevelName } from "@/types";

interface PathRecommendationsProps {
  userId: string;
  onPathSelect?: (pathId: string) => void;
  limit?: number;
}

export default function PathRecommendations({
  userId,
  onPathSelect,
  limit = 5,
}: PathRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PathRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [userId, limit]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/paths?userId=${userId}&recommendations=true&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to load path recommendations");
      }

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data);
      } else {
        throw new Error(data.error || "Failed to load recommendations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 80) return "Highly Recommended";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Potential Interest";
    return "Consider Later";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Recommended Paths
          </h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadRecommendations}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Recommendations Available
        </h3>
        <p className="text-gray-500">
          Complete your onboarding to get personalized path recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Recommended Paths
        </h3>
        <button
          onClick={loadRecommendations}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.path.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {recommendation.path.pathName}
                  </h4>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {recommendation.path.interestCategory}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {recommendation.path.description}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getRelevanceColor(
                    recommendation.relevanceScore
                  )}`}
                >
                  {getRelevanceLabel(recommendation.relevanceScore)}
                </span>
                <span className="text-xs text-gray-500">
                  {recommendation.relevanceScore}% match
                </span>
              </div>
            </div>

            {/* Requirements and Status */}
            <div className="flex items-center space-x-4 mb-3 text-sm">
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Required: {getSkillLevelName(recommendation.requiredLevel)}
              </div>

              {recommendation.currentUserLevel && (
                <div className="flex items-center text-gray-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your level:{" "}
                  {getSkillLevelName(recommendation.currentUserLevel)}
                </div>
              )}

              <div
                className={`flex items-center ${
                  recommendation.canStart ? "text-green-600" : "text-orange-600"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d={
                      recommendation.canStart
                        ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    }
                    clipRule="evenodd"
                  />
                </svg>
                {recommendation.canStart ? "Ready to start" : "Level up first"}
              </div>
            </div>

            {/* Reasons */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Why this path?
              </h5>
              <ul className="space-y-1">
                {recommendation.reasons.map((reason, reasonIndex) => (
                  <li
                    key={reasonIndex}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <svg
                      className="w-3 h-3 mt-0.5 mr-2 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {recommendation.path.stages.length} stages •
                {recommendation.path.ageRangeMin &&
                recommendation.path.ageRangeMax
                  ? ` Ages ${recommendation.path.ageRangeMin}-${recommendation.path.ageRangeMax}`
                  : " All ages"}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onPathSelect?.(recommendation.path.id)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View Path
                </button>
                {recommendation.canStart && (
                  <button
                    onClick={() => {
                      // Start path logic would go here
                      onPathSelect?.(recommendation.path.id);
                    }}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Start Journey
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length >= limit && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              // Load more recommendations logic
              loadRecommendations();
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View More Recommendations
          </button>
        </div>
      )}
    </div>
  );
}
