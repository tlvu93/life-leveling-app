"use client";

import React, { useState, useEffect } from "react";
import { CohortComparison, CommitmentLevel } from "@/types";
import { ComparisonCard } from "./ComparisonCard";
import { ComparisonSettings } from "./ComparisonSettings";

interface ComparisonDashboardProps {
  userId: string;
}

export function ComparisonDashboard({ userId }: ComparisonDashboardProps) {
  const [comparisons, setComparisons] = useState<CohortComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOptedIn, setHasOptedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadComparisons();
    checkOptInStatus();
  }, [userId]);

  const loadComparisons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comparisons?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setComparisons(data.data || []);
        setError(null);
      } else {
        if (response.status === 403) {
          setHasOptedIn(false);
        } else {
          setError(data.error || "Failed to load comparisons");
        }
      }
    } catch (err) {
      setError("Failed to load comparisons");
      console.error("Error loading comparisons:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkOptInStatus = async () => {
    try {
      const response = await fetch(
        `/api/comparisons/preferences?userId=${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setHasOptedIn(data.data.allowPeerComparisons);
      }
    } catch (err) {
      console.error("Error checking opt-in status:", err);
    }
  };

  const handleOptInChange = async (optedIn: boolean) => {
    try {
      const response = await fetch("/api/comparisons/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          allowPeerComparisons: optedIn,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHasOptedIn(optedIn);
        if (optedIn) {
          // Reload comparisons after opting in
          setTimeout(() => loadComparisons(), 1000);
        } else {
          setComparisons([]);
        }
      } else {
        setError(data.error || "Failed to update preferences");
      }
    } catch (err) {
      setError("Failed to update preferences");
      console.error("Error updating preferences:", err);
    }
  };

  const getCommitmentLevelDescription = (level: CommitmentLevel): string => {
    switch (level) {
      case CommitmentLevel.CASUAL:
        return "You're exploring this interest at your own pace - perfect for discovering what you enjoy!";
      case CommitmentLevel.AVERAGE:
        return "You're building steady skills and making regular progress in this area.";
      case CommitmentLevel.INVESTED:
        return "You're dedicated to growing in this interest and putting in focused effort.";
      case CommitmentLevel.COMPETITIVE:
        return "You're pushing yourself to excel and achieve high performance in this area.";
      default:
        return "You're on your learning journey in this interest.";
    }
  };

  if (!hasOptedIn) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-primary/10 rounded-xl p-8 text-center border border-border">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Compare Your Progress with Peers
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            See how you're doing compared to other learners your age with
            similar interests and commitment levels. All comparisons are
            completely anonymous and designed to encourage your growth journey.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>100% anonymous - no personal information shared</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Encouraging messages focused on growth</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Opt out anytime in your privacy settings</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleOptInChange(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Enable Peer Comparisons
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              Learn More
            </button>
          </div>
        </div>

        {showSettings && (
          <ComparisonSettings
            userId={userId}
            hasOptedIn={hasOptedIn}
            onOptInChange={handleOptInChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Loading your comparisons...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading comparisons
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadComparisons}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Progress Compared to Peers
          </h1>
          <p className="text-gray-600">
            See how you're doing compared to other learners with similar
            interests and commitment levels
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {comparisons.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No comparison data yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add some interests and set your skill levels to see how you compare
            with peers!
          </p>
          <button
            onClick={loadComparisons}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {comparisons.map((comparison) => (
            <ComparisonCard
              key={comparison.interest}
              comparison={comparison}
              commitmentDescription={getCommitmentLevelDescription(
                comparison.intentLevel
              )}
            />
          ))}
        </div>
      )}

      {showSettings && (
        <ComparisonSettings
          userId={userId}
          hasOptedIn={hasOptedIn}
          onOptInChange={handleOptInChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
