"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GoalCreationWizard from "@/components/goals/GoalCreationWizard";
import GoalsList from "@/components/goals/GoalsList";
import { Goal, Interest, GoalFormData, GoalStatus } from "@/types";

export default function AdventurePage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
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
      await loadGoals();
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await fetch("/api/goals");
      if (!response.ok) {
        throw new Error("Failed to load goals");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load goals");
      }

      setGoals(data.data || []);
    } catch (error) {
      console.error("Error loading goals:", error);
      throw error;
    }
  };

  const handleCreateGoal = async (goalData: GoalFormData) => {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create goal");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create goal");
      }

      // Refresh goals list
      await loadGoals();
      setShowCreateWizard(false);
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  };

  const handleGoalStatusUpdate = async (goalId: string, status: GoalStatus) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update goal");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update goal");
      }
    } catch (error) {
      console.error("Error updating goal status:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (userInterests.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Complete Your Profile First
          </h2>
          <p className="text-muted-foreground mb-4">
            You need to set up your interests before you can create goals.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {showCreateWizard ? (
          <GoalCreationWizard
            userInterests={userInterests}
            onGoalCreate={handleCreateGoal}
            onCancel={() => setShowCreateWizard(false)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    🚀 Adventure Mode
                  </h1>
                  <p className="text-muted-foreground">
                    Set goals, make promises to your future self, and track your
                    growth journey
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  + Create New Goal
                </button>
              </div>
            </div>

            {/* Goals Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <GoalStatsCard
                title="Active Goals"
                count={
                  goals.filter((g) => g.status === GoalStatus.ACTIVE).length
                }
                color="blue"
                icon="🎯"
              />
              <GoalStatsCard
                title="Completed"
                count={
                  goals.filter((g) => g.status === GoalStatus.COMPLETED).length
                }
                color="green"
                icon="✅"
              />
              <GoalStatsCard
                title="This Month"
                count={
                  goals.filter((g) => {
                    const goalDate = new Date(g.createdAt);
                    const now = new Date();
                    return (
                      goalDate.getMonth() === now.getMonth() &&
                      goalDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
                color="purple"
                icon="📅"
              />
              <GoalStatsCard
                title="Total Goals"
                count={goals.length}
                color="gray"
                icon="📊"
              />
            </div>

            {/* Goals List */}
            <GoalsList
              goals={goals}
              onGoalStatusUpdate={handleGoalStatusUpdate}
              onRefresh={loadGoals}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface GoalStatsCardProps {
  title: string;
  count: number;
  color: "blue" | "green" | "purple" | "gray";
  icon: string;
}

function GoalStatsCard({ title, count, color, icon }: GoalStatsCardProps) {
  const colorClasses = {
    blue: "bg-primary/10 border-primary/20 text-primary",
    green:
      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    purple:
      "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200",
    gray: "bg-muted/50 border-border text-muted-foreground",
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
