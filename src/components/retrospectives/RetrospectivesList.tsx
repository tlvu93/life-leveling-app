"use client";

import { useState } from "react";
import { Retrospective, RetrospectiveType } from "@/types";

interface RetrospectivesListProps {
  retrospectives: Retrospective[];
  onRefresh: () => void;
}

export default function RetrospectivesList({
  retrospectives,
  onRefresh,
}: RetrospectivesListProps) {
  const [filter, setFilter] = useState<RetrospectiveType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRetrospectives = retrospectives.filter((retro) =>
    filter === "all" ? true : retro.type === filter
  );

  const getTypeColor = (type: RetrospectiveType) => {
    switch (type) {
      case RetrospectiveType.WEEKLY:
        return "bg-blue-100 text-blue-800";
      case RetrospectiveType.MONTHLY:
        return "bg-green-100 text-green-800";
      case RetrospectiveType.YEARLY:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeEmoji = (type: RetrospectiveType) => {
    switch (type) {
      case RetrospectiveType.WEEKLY:
        return "📅";
      case RetrospectiveType.MONTHLY:
        return "🗓️";
      case RetrospectiveType.YEARLY:
        return "📆";
      default:
        return "🔄";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "weekly", "monthly", "yearly"].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as RetrospectiveType | "all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterType
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType !== "all" && (
              <span className="ml-2 text-xs">
                ({retrospectives.filter((r) => r.type === filterType).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Retrospectives List */}
      {filteredRetrospectives.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {filter === "all"
              ? "No retrospectives yet"
              : `No ${filter} retrospectives`}
          </h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "Start your reflection journey by creating your first retrospective!"
              : `You haven't created any ${filter} retrospectives yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRetrospectives.map((retrospective) => (
            <RetrospectiveCard
              key={retrospective.id}
              retrospective={retrospective}
              isExpanded={expandedId === retrospective.id}
              onToggleExpanded={() => toggleExpanded(retrospective.id)}
              getTypeColor={getTypeColor}
              getTypeEmoji={getTypeEmoji}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RetrospectiveCardProps {
  retrospective: Retrospective;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  getTypeColor: (type: RetrospectiveType) => string;
  getTypeEmoji: (type: RetrospectiveType) => string;
  formatDate: (date: Date) => string;
}

function RetrospectiveCard({
  retrospective,
  isExpanded,
  onToggleExpanded,
  getTypeColor,
  getTypeEmoji,
  formatDate,
}: RetrospectiveCardProps) {
  const hasInsights =
    retrospective.insights && Object.keys(retrospective.insights).length > 0;
  const hasSkillUpdates =
    retrospective.skillUpdates &&
    Object.keys(retrospective.skillUpdates).length > 0;
  const hasGoalsReviewed =
    retrospective.goalsReviewed &&
    Object.keys(retrospective.goalsReviewed).length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 cursor-pointer" onClick={onToggleExpanded}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {getTypeEmoji(retrospective.type)}
              </span>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {retrospective.type.charAt(0).toUpperCase() +
                    retrospective.type.slice(1)}{" "}
                  Retrospective
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(retrospective.completedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  retrospective.type
                )}`}
              >
                {retrospective.type}
              </span>

              <div className="flex items-center gap-4 text-gray-500">
                {hasInsights && (
                  <span className="flex items-center gap-1">
                    <span>💭</span>
                    <span>Insights</span>
                  </span>
                )}
                {hasSkillUpdates && (
                  <span className="flex items-center gap-1">
                    <span>📈</span>
                    <span>Skills Updated</span>
                  </span>
                )}
                {hasGoalsReviewed && (
                  <span className="flex items-center gap-1">
                    <span>🎯</span>
                    <span>Goals Reviewed</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="ml-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="space-y-6">
            {/* Insights */}
            {hasInsights && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💭</span>
                  Reflections
                </h4>
                <div className="space-y-3">
                  {Object.entries(retrospective.insights || {}).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="bg-white rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </p>
                          <p className="text-gray-600">{value}</p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Skill Updates */}
            {hasSkillUpdates && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📈</span>
                  Skill Updates
                </h4>
                <div className="bg-white rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(retrospective.skillUpdates || {}).map(
                      ([skill, level]) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{skill}</span>
                          <span className="text-green-600">Level {level}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Goals Reviewed */}
            {hasGoalsReviewed && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  Goals Reviewed
                </h4>
                <div className="bg-white rounded-lg p-4">
                  <div className="space-y-2">
                    {Array.isArray(retrospective.goalsReviewed) ? (
                      retrospective.goalsReviewed.map((goalId, index) => (
                        <div key={goalId || index} className="text-gray-600">
                          Goal: {goalId}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-600">
                        {Object.keys(retrospective.goalsReviewed || {}).length}{" "}
                        goals reviewed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!hasInsights && !hasSkillUpdates && !hasGoalsReviewed && (
              <div className="text-center py-4 text-gray-500">
                <p>
                  This retrospective doesn&apos;t contain any detailed
                  information.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
