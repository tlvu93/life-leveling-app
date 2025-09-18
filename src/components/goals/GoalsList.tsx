"use client";

import { useState } from "react";
import { Goal, GoalStatus, GoalType, Timeframe } from "@/types";

interface GoalsListProps {
  goals: Goal[];
  onGoalStatusUpdate: (goalId: string, status: GoalStatus) => Promise<void>;
  onRefresh: () => void;
}

export default function GoalsList({
  goals,
  onGoalStatusUpdate,
  onRefresh,
}: GoalsListProps) {
  const [filter, setFilter] = useState<GoalStatus | "all">("all");
  const [updatingGoals, setUpdatingGoals] = useState<Set<string>>(new Set());

  const filteredGoals = goals.filter((goal) =>
    filter === "all" ? true : goal.status === filter
  );

  const handleStatusUpdate = async (goalId: string, newStatus: GoalStatus) => {
    setUpdatingGoals((prev) => new Set(prev).add(goalId));
    try {
      await onGoalStatusUpdate(goalId, newStatus);
      onRefresh();
    } catch (error) {
      console.error("Error updating goal status:", error);
    } finally {
      setUpdatingGoals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(goalId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        return "bg-primary/10 text-primary";
      case GoalStatus.COMPLETED:
        return "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200";
      case GoalStatus.PAUSED:
        return "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200";
      case GoalStatus.CANCELLED:
        return "bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case GoalType.SKILL_INCREASE:
        return "📈";
      case GoalType.PROJECT_COMPLETION:
        return "🎯";
      case GoalType.BROAD_PROMISE:
        return "💫";
      default:
        return "📝";
    }
  };

  const getTimeframeLabel = (timeframe: Timeframe) => {
    switch (timeframe) {
      case Timeframe.WEEKLY:
        return "Weekly";
      case Timeframe.MONTHLY:
        return "Monthly";
      case Timeframe.YEARLY:
        return "Yearly";
      default:
        return timeframe;
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (goal: Goal) => {
    if (!goal.targetDate || goal.status === GoalStatus.COMPLETED) return false;
    return new Date(goal.targetDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "active", "completed", "paused", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as GoalStatus | "all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== "all" && (
              <span className="ml-2 text-xs">
                ({goals.filter((g) => g.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {filter === "all" ? "No goals yet" : `No ${filter} goals`}
          </h3>
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Create your first goal to start your adventure!"
              : `You don't have any ${filter} goals at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updatingGoals.has(goal.id)}
              getStatusColor={getStatusColor}
              getGoalTypeIcon={getGoalTypeIcon}
              getTimeframeLabel={getTimeframeLabel}
              formatDate={formatDate}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onStatusUpdate: (goalId: string, status: GoalStatus) => Promise<void>;
  isUpdating: boolean;
  getStatusColor: (status: GoalStatus) => string;
  getGoalTypeIcon: (type: GoalType) => string;
  getTimeframeLabel: (timeframe: Timeframe) => string;
  formatDate: (date: Date | null | undefined) => string | null;
  isOverdue: (goal: Goal) => boolean;
}

function GoalCard({
  goal,
  onStatusUpdate,
  isUpdating,
  getStatusColor,
  getGoalTypeIcon,
  getTimeframeLabel,
  formatDate,
  isOverdue,
}: GoalCardProps) {
  const [showActions, setShowActions] = useState(false);

  const availableActions = getAvailableActions(goal.status);

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getGoalTypeIcon(goal.goalType)}</span>
            <div>
              <h3 className="font-semibold text-foreground">{goal.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{goal.interestCategory}</span>
                <span>•</span>
                <span>{getTimeframeLabel(goal.timeframe)}</span>
                {goal.targetLevel && (
                  <>
                    <span>•</span>
                    <span>Target: Level {goal.targetLevel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-foreground mb-3">{goal.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                goal.status
              )}`}
            >
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </span>

            {goal.targetDate && (
              <span
                className={`text-xs ${
                  isOverdue(goal)
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isOverdue(goal) ? "Overdue: " : "Due: "}
                {formatDate(goal.targetDate)}
              </span>
            )}

            {goal.completedAt && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Completed: {formatDate(goal.completedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            )}
          </button>

          {showActions && availableActions.length > 0 && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
              {availableActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => {
                    onStatusUpdate(goal.id, action.status);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getAvailableActions(currentStatus: GoalStatus) {
  const actions: Array<{ status: GoalStatus; label: string }> = [];

  switch (currentStatus) {
    case GoalStatus.ACTIVE:
      actions.push(
        { status: GoalStatus.COMPLETED, label: "Mark Complete" },
        { status: GoalStatus.PAUSED, label: "Pause Goal" },
        { status: GoalStatus.CANCELLED, label: "Cancel Goal" }
      );
      break;
    case GoalStatus.PAUSED:
      actions.push(
        { status: GoalStatus.ACTIVE, label: "Resume Goal" },
        { status: GoalStatus.COMPLETED, label: "Mark Complete" },
        { status: GoalStatus.CANCELLED, label: "Cancel Goal" }
      );
      break;
    case GoalStatus.COMPLETED:
      actions.push({ status: GoalStatus.ACTIVE, label: "Reopen Goal" });
      break;
    case GoalStatus.CANCELLED:
      actions.push({ status: GoalStatus.ACTIVE, label: "Reopen Goal" });
      break;
  }

  return actions;
}
