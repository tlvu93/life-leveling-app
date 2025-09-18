"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RetrospectiveWizard from "@/components/retrospectives/RetrospectiveWizard";
import RetrospectivesList from "@/components/retrospectives/RetrospectivesList";
import ProgressComparison from "@/components/retrospectives/ProgressComparison";
import {
  Retrospective,
  Interest,
  Goal,
  RetrospectiveType,
  SkillLevel,
} from "@/types";

export default function RetrospectivesPage() {
  const router = useRouter();
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedType, setSelectedType] = useState<RetrospectiveType>(
    RetrospectiveType.WEEKLY
  );
  const [activeTab, setActiveTab] = useState<"retrospectives" | "progress">(
    "retrospectives"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user profile to get interests
      const profileResponse = await fetch("/api/user/profile");
      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          router.push("/register");
          return;
        }
        throw new Error("Failed to load user profile");
      }

      const profileData = await profileResponse.json();
      if (!profileData.success) {
        throw new Error(profileData.error || "Failed to load user profile");
      }

      setUserInterests(profileData.data.interests || []);

      // Load goals
      const goalsResponse = await fetch("/api/goals");
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        if (goalsData.success) {
          setUserGoals(goalsData.data || []);
        }
      }

      // Load retrospectives
      await loadRetrospectives();
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRetrospectives = async () => {
    try {
      const response = await fetch("/api/retrospectives");
      if (!response.ok) {
        throw new Error("Failed to load retrospectives");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load retrospectives");
      }

      setRetrospectives(data.data || []);
    } catch (error) {
      console.error("Error loading retrospectives:", error);
      throw error;
    }
  };

  const handleCreateRetrospective = async (retrospectiveData: {
    type: RetrospectiveType;
    insights: Record<string, any>;
    skillUpdates: Record<string, SkillLevel>;
    goalsReviewed: string[];
  }) => {
    try {
      const response = await fetch("/api/retrospectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(retrospectiveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create retrospective");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create retrospective");
      }

      // Refresh retrospectives list
      await loadRetrospectives();
      setShowCreateWizard(false);
    } catch (error) {
      console.error("Error creating retrospective:", error);
      throw error;
    }
  };

  const getNextRecommendedType = (): RetrospectiveType => {
    const now = new Date();
    const lastWeekly = retrospectives
      .filter((r) => r.type === RetrospectiveType.WEEKLY)
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];

    const lastMonthly = retrospectives
      .filter((r) => r.type === RetrospectiveType.MONTHLY)
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];

    // If no weekly retrospective in the last 7 days, recommend weekly
    if (
      !lastWeekly ||
      now.getTime() - new Date(lastWeekly.completedAt).getTime() >
        7 * 24 * 60 * 60 * 1000
    ) {
      return RetrospectiveType.WEEKLY;
    }

    // If no monthly retrospective in the last 30 days, recommend monthly
    if (
      !lastMonthly ||
      now.getTime() - new Date(lastMonthly.completedAt).getTime() >
        30 * 24 * 60 * 60 * 1000
    ) {
      return RetrospectiveType.MONTHLY;
    }

    // Default to weekly
    return RetrospectiveType.WEEKLY;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your retrospectives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (userInterests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Complete Your Profile First
          </h2>
          <p className="text-gray-600 mb-4">
            You need to set up your interests before you can create
            retrospectives.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {showCreateWizard ? (
          <RetrospectiveWizard
            type={selectedType}
            userInterests={userInterests}
            userGoals={userGoals}
            onRetrospectiveCreate={handleCreateRetrospective}
            onCancel={() => setShowCreateWizard(false)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    🔄 Retrospectives & Reflection
                  </h1>
                  <p className="text-gray-600">
                    Look back on your journey, celebrate growth, and plan ahead
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) =>
                        setSelectedType(e.target.value as RetrospectiveType)
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={RetrospectiveType.WEEKLY}>
                        Weekly Check-in
                      </option>
                      <option value={RetrospectiveType.MONTHLY}>
                        Monthly Review
                      </option>
                      <option value={RetrospectiveType.YEARLY}>
                        Yearly Reflection
                      </option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedType(getNextRecommendedType());
                      setShowCreateWizard(true);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    + Start Retrospective
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("retrospectives")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "retrospectives"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📝 My Retrospectives
                </button>
                <button
                  onClick={() => setActiveTab("progress")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "progress"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📊 Progress Comparison
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "retrospectives" ? (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <RetrospectiveStatsCard
                    title="Total Retrospectives"
                    count={retrospectives.length}
                    color="blue"
                    icon="🔄"
                  />
                  <RetrospectiveStatsCard
                    title="This Month"
                    count={
                      retrospectives.filter((r) => {
                        const retroDate = new Date(r.completedAt);
                        const now = new Date();
                        return (
                          retroDate.getMonth() === now.getMonth() &&
                          retroDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                    color="green"
                    icon="📅"
                  />
                  <RetrospectiveStatsCard
                    title="Longest Streak"
                    count={calculateStreak(retrospectives)}
                    color="purple"
                    icon="🔥"
                  />
                </div>

                {/* Retrospectives List */}
                <RetrospectivesList
                  retrospectives={retrospectives}
                  onRefresh={loadRetrospectives}
                />
              </>
            ) : (
              <div className="space-y-6">
                <ProgressComparison
                  goals={userGoals}
                  retrospectives={retrospectives}
                  interests={userInterests}
                  timeframe="week"
                />
                <ProgressComparison
                  goals={userGoals}
                  retrospectives={retrospectives}
                  interests={userInterests}
                  timeframe="month"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface RetrospectiveStatsCardProps {
  title: string;
  count: number;
  color: "blue" | "green" | "purple";
  icon: string;
}

function RetrospectiveStatsCard({
  title,
  count,
  color,
  icon,
}: RetrospectiveStatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function calculateStreak(retrospectives: Retrospective[]): number {
  if (retrospectives.length === 0) return 0;

  // Sort retrospectives by date (most recent first)
  const sorted = [...retrospectives].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  let streak = 0;
  let currentDate = new Date();

  // Simple streak calculation - count consecutive retrospectives
  // This is a basic implementation; you could make it more sophisticated
  for (const retro of sorted) {
    const retroDate = new Date(retro.completedAt);
    const daysDiff = Math.floor(
      (currentDate.getTime() - retroDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      // Within a week
      streak++;
      currentDate = retroDate;
    } else {
      break;
    }
  }

  return streak;
}
