"use client";

import React, { useState, useEffect } from "react";
import { PredefinedPath, UserPathProgress, Interest } from "@/types";
import { PathMilestone, calculateSkillSynergies } from "@/lib/path-management";
import PathVisualization from "./PathVisualization";
import SynergyVisualization from "./SynergyVisualization";
import PathRecommendations from "./PathRecommendations";

interface PathsDashboardProps {
  userId: string;
}

export default function PathsDashboard({ userId }: PathsDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "recommendations" | "my-paths" | "synergies"
  >("recommendations");
  const [userPaths, setUserPaths] = useState<
    Array<PredefinedPath & { progress?: UserPathProgress }>
  >([]);
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [selectedPath, setSelectedPath] = useState<PredefinedPath | null>(null);
  const [selectedPathMilestones, setSelectedPathMilestones] = useState<
    PathMilestone[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user paths with progress
      const pathsResponse = await fetch(
        `/api/user/path-progress?userId=${userId}`
      );
      if (!pathsResponse.ok) throw new Error("Failed to load user paths");

      const pathsData = await pathsResponse.json();
      if (pathsData.success) {
        setUserPaths(pathsData.data);
      }

      // Load user interests
      const interestsResponse = await fetch(
        `/api/user/interests?userId=${userId}`
      );
      if (!interestsResponse.ok)
        throw new Error("Failed to load user interests");

      const interestsData = await interestsResponse.json();
      if (interestsData.success) {
        setUserInterests(interestsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePathSelect = async (pathId: string) => {
    try {
      // Load path details
      const pathResponse = await fetch(`/api/paths/${pathId}`);
      if (!pathResponse.ok) throw new Error("Failed to load path details");

      const pathData = await pathResponse.json();
      if (pathData.success) {
        setSelectedPath(pathData.data);

        // Load milestones for this path
        const milestonesResponse = await fetch(
          `/api/paths/${pathId}/milestones?userId=${userId}`
        );
        if (milestonesResponse.ok) {
          const milestonesData = await milestonesResponse.json();
          if (milestonesData.success) {
            setSelectedPathMilestones(milestonesData.data);
          }
        }

        setActiveTab("my-paths");
      }
    } catch (err) {
      console.error("Error loading path details:", err);
    }
  };

  const handleStartPath = async (pathId: string) => {
    try {
      const response = await fetch("/api/user/path-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pathId,
          action: "start",
        }),
      });

      if (!response.ok) throw new Error("Failed to start path");

      const data = await response.json();
      if (data.success) {
        // Refresh user paths
        await loadUserData();
        // Select the newly started path
        await handlePathSelect(pathId);
      }
    } catch (err) {
      console.error("Error starting path:", err);
    }
  };

  const handleCompleteStage = async (pathId: string, stageNumber: number) => {
    try {
      const response = await fetch("/api/user/path-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pathId,
          action: "complete_stage",
          stageNumber,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete stage");

      const data = await response.json();
      if (data.success) {
        // Refresh milestones
        if (selectedPath) {
          const milestonesResponse = await fetch(
            `/api/paths/${selectedPath.id}/milestones?userId=${userId}`
          );
          if (milestonesResponse.ok) {
            const milestonesData = await milestonesResponse.json();
            if (milestonesData.success) {
              setSelectedPathMilestones(milestonesData.data);
            }
          }
        }
        // Refresh user paths
        await loadUserData();
      }
    } catch (err) {
      console.error("Error completing stage:", err);
    }
  };

  const synergies = calculateSkillSynergies(userInterests, userPaths);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
          onClick={loadUserData}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Learning Paths
        </h1>
        <p className="text-gray-600">
          Discover structured learning journeys and track your progress across
          different skills.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "recommendations", label: "Recommendations", icon: "⭐" },
            { id: "my-paths", label: "My Paths", icon: "🛤️" },
            { id: "synergies", label: "Skill Synergies", icon: "🔗" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === "recommendations" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PathRecommendations
                userId={userId}
                onPathSelect={handlePathSelect}
                limit={10}
              />
            </div>
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Your Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Paths</span>
                    <span className="font-semibold">
                      {userPaths.filter((p) => p.progress).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Stages</span>
                    <span className="font-semibold">
                      {userPaths.reduce(
                        (total, path) =>
                          total + (path.progress?.stagesCompleted.length || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skill Synergies</span>
                    <span className="font-semibold">{synergies.length}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {userPaths
                    .filter((p) => p.progress)
                    .slice(0, 3)
                    .map((path) => (
                      <div
                        key={path.id}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {path.pathName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Stage {(path.progress?.currentStage || 0) + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  {userPaths.filter((p) => p.progress).length === 0 && (
                    <p className="text-sm text-gray-500">No active paths yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "my-paths" && (
          <div className="space-y-8">
            {selectedPath && selectedPathMilestones.length > 0 ? (
              <PathVisualization
                path={selectedPath}
                progress={
                  userPaths.find((p) => p.id === selectedPath.id)?.progress
                }
                milestones={selectedPathMilestones}
                onStageClick={(stageNumber) =>
                  handleCompleteStage(selectedPath.id, stageNumber)
                }
                showSynergies={true}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePathSelect(path.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {path.pathName}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {path.interestCategory}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {path.description}
                    </p>

                    {path.progress ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {path.progress.stagesCompleted.length} /{" "}
                            {path.stages.length} stages
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                (path.progress.stagesCompleted.length /
                                  path.stages.length) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartPath(path.id);
                        }}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Start Path
                      </button>
                    )}
                  </div>
                ))}

                {userPaths.length === 0 && (
                  <div className="col-span-full text-center py-12">
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
                      No Paths Started
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Check out the recommendations tab to find paths that match
                      your interests.
                    </p>
                    <button
                      onClick={() => setActiveTab("recommendations")}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Recommendations
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "synergies" && (
          <div className="space-y-8">
            <SynergyVisualization
              userInterests={userInterests}
              paths={userPaths}
              synergies={synergies}
              width={800}
              height={500}
              onNodeClick={(skill) => {
                // Filter paths by skill and switch to recommendations
                setActiveTab("recommendations");
              }}
            />

            {/* Synergy Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Strongest Synergies
                </h3>
                <div className="space-y-3">
                  {synergies
                    .sort((a, b) => b.synergyFactor - a.synergyFactor)
                    .slice(0, 5)
                    .map((synergy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {synergy.sourceSkill} → {synergy.targetSkill}
                          </p>
                          <p className="text-sm text-gray-600">
                            {synergy.description}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          +{Math.round(synergy.synergyFactor * 100)}%
                        </span>
                      </div>
                    ))}
                  {synergies.length === 0 && (
                    <p className="text-gray-500">
                      No synergies found. Add more interests to discover
                      connections.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Synergy Tips
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <svg
                      className="w-4 h-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Focus on skills with high synergy factors to accelerate
                      overall growth
                    </span>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-4 h-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Practice related skills together to maximize synergy
                      benefits
                    </span>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-4 h-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Look for paths that combine multiple interests for
                      compound growth
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
