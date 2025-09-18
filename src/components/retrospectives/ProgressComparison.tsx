"use client";

import { Goal, Retrospective, Interest, GoalStatus, SkillLevel } from "@/types";

interface ProgressComparisonProps {
  goals: Goal[];
  retrospectives: Retrospective[];
  interests: Interest[];
  timeframe: "week" | "month" | "year";
}

export default function ProgressComparison({
  goals,
  retrospectives,
  interests,
  timeframe,
}: ProgressComparisonProps) {
  const getTimeframePeriod = () => {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getTimeframePeriod();

  // Filter goals and retrospectives for the timeframe
  const periodGoals = goals.filter((goal) => {
    const goalDate = new Date(goal.createdAt);
    return goalDate >= startDate && goalDate <= endDate;
  });

  const periodRetrospectives = retrospectives.filter((retro) => {
    const retroDate = new Date(retro.completedAt);
    return retroDate >= startDate && retroDate <= endDate;
  });

  // Calculate goal completion stats
  const totalGoals = periodGoals.length;
  const completedGoals = periodGoals.filter(
    (goal) => goal.status === GoalStatus.COMPLETED
  ).length;
  const activeGoals = periodGoals.filter(
    (goal) => goal.status === GoalStatus.ACTIVE
  ).length;
  const pausedGoals = periodGoals.filter(
    (goal) => goal.status === GoalStatus.PAUSED
  ).length;

  // Calculate skill improvements from retrospectives
  const skillImprovements = new Map<
    string,
    { from: SkillLevel; to: SkillLevel }
  >();

  periodRetrospectives.forEach((retro) => {
    if (retro.skillUpdates) {
      Object.entries(retro.skillUpdates).forEach(([skill, newLevel]) => {
        const interest = interests.find((i) => i.category === skill);
        if (interest) {
          skillImprovements.set(skill, {
            from: interest.currentLevel,
            to: newLevel as SkillLevel,
          });
        }
      });
    }
  });

  const getCompletionRate = () => {
    if (totalGoals === 0) return 0;
    return Math.round((completedGoals / totalGoals) * 100);
  };

  const getSkillLevelName = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.NOVICE:
        return "Novice";
      case SkillLevel.INTERMEDIATE:
        return "Intermediate";
      case SkillLevel.ADVANCED:
        return "Advanced";
      case SkillLevel.EXPERT:
        return "Expert";
      default:
        return "Unknown";
    }
  };

  const getEncouragingMessage = () => {
    const completionRate = getCompletionRate();
    const skillGrowth = Array.from(skillImprovements.values()).filter(
      (improvement) => improvement.to > improvement.from
    ).length;

    if (completionRate >= 80 && skillGrowth > 0) {
      return "🌟 Amazing progress! You're crushing your goals and growing your skills!";
    } else if (completionRate >= 60) {
      return "🎯 Great work! You're making solid progress on your goals!";
    } else if (skillGrowth > 0) {
      return "📈 Excellent! You're developing your skills even if some goals are still in progress!";
    } else if (totalGoals > 0) {
      return "🌱 Keep going! Every step forward is progress, even if it doesn't feel like it!";
    } else {
      return "🚀 Ready to set some goals and start your growth journey?";
    }
  };

  const formatTimeframe = () => {
    switch (timeframe) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      default:
        return "This Period";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          📊 Progress Report: {formatTimeframe()}
        </h3>
        <p className="text-gray-600">
          How your promises compare to your results
        </p>
      </div>

      {/* Encouraging Message */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 font-medium">{getEncouragingMessage()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals Overview */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Goal Progress
          </h4>

          {totalGoals === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>No goals set for this {timeframe}</p>
              <p className="text-sm">
                Consider setting some goals to track your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Completion Rate */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Completion Rate
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {getCompletionRate()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getCompletionRate()}%` }}
                  />
                </div>
              </div>

              {/* Goal Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {completedGoals}
                  </div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {activeGoals}
                  </div>
                  <div className="text-sm text-blue-700">Active</div>
                </div>
              </div>

              {pausedGoals > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {pausedGoals}
                  </div>
                  <div className="text-sm text-yellow-700">
                    Paused (that's okay!)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skill Growth */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span>
            Skill Growth
          </h4>

          {skillImprovements.size === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>No skill updates this {timeframe}</p>
              <p className="text-sm">
                Reflect on your progress in your next retrospective!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(skillImprovements.entries()).map(
                ([skill, improvement]) => (
                  <div key={skill} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {getSkillLevelName(improvement.from)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-green-600">
                          {getSkillLevelName(improvement.to)}
                        </span>
                        {improvement.to > improvement.from && (
                          <span className="text-green-500">📈</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retrospective Summary */}
      {periodRetrospectives.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔄</span>
            Reflection Activity
          </h4>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-purple-800">
                You completed <strong>{periodRetrospectives.length}</strong>{" "}
                retrospective
                {periodRetrospectives.length !== 1 ? "s" : ""} this {timeframe}
              </span>
              <span className="text-purple-600 text-2xl">🎉</span>
            </div>
            <p className="text-sm text-purple-700 mt-2">
              Regular reflection is key to growth. Keep up the great habit!
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">💡 What's Next?</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {activeGoals > 0 && (
            <p>
              • Keep working on your {activeGoals} active goal
              {activeGoals !== 1 ? "s" : ""}
            </p>
          )}
          {completedGoals > 0 && (
            <p>
              • Celebrate your {completedGoals} completed goal
              {completedGoals !== 1 ? "s" : ""}!
            </p>
          )}
          {totalGoals === 0 && (
            <p>• Consider setting some goals to guide your growth</p>
          )}
          {periodRetrospectives.length === 0 && (
            <p>• Try doing a retrospective to reflect on your progress</p>
          )}
        </div>
      </div>
    </div>
  );
}
