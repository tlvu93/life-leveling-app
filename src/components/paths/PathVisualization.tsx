"use client";

import React, { useState, useEffect } from "react";
import {
  PredefinedPath,
  UserPathProgress,
  PathStage,
  SkillLevel,
} from "@/types";
import { PathMilestone } from "@/lib/path-management";

interface PathVisualizationProps {
  path: PredefinedPath;
  progress?: UserPathProgress;
  milestones: PathMilestone[];
  onStageClick?: (stageNumber: number) => void;
  showSynergies?: boolean;
}

export default function PathVisualization({
  path,
  progress,
  milestones,
  onStageClick,
  showSynergies = true,
}: PathVisualizationProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const handleStageClick = (stageNumber: number) => {
    setSelectedStage(stageNumber);
    onStageClick?.(stageNumber);
  };

  const getStageStatus = (milestone: PathMilestone) => {
    if (milestone.isCompleted) return "completed";
    if (milestone.isUnlocked) return "unlocked";
    return "locked";
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 border-green-600 text-white";
      case "unlocked":
        return "bg-blue-500 border-blue-600 text-white hover:bg-blue-600";
      case "locked":
        return "bg-gray-300 border-gray-400 text-gray-600";
      default:
        return "bg-gray-300 border-gray-400 text-gray-600";
    }
  };

  const getConnectorColor = (fromStatus: string, toStatus: string) => {
    if (fromStatus === "completed") return "border-green-500";
    if (fromStatus === "unlocked" && toStatus !== "locked")
      return "border-blue-500";
    return "border-gray-300";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Path Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{path.pathName}</h2>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {path.interestCategory}
            </span>
            {progress && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Stage {progress.currentStage + 1}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-600 mb-4">{path.description}</p>

        {/* Progress Bar */}
        {progress && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (progress.stagesCompleted.length / milestones.length) * 100
                }%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Path Stages Visualization */}
      <div className="relative">
        <div className="flex flex-col space-y-8">
          {milestones.map((milestone, index) => {
            const status = getStageStatus(milestone);
            const isSelected = selectedStage === milestone.stageNumber;
            const nextMilestone = milestones[index + 1];
            const nextStatus = nextMilestone
              ? getStageStatus(nextMilestone)
              : null;

            return (
              <div key={milestone.stageNumber} className="relative">
                {/* Stage Node */}
                <div className="flex items-center">
                  {/* Stage Circle */}
                  <button
                    onClick={() => handleStageClick(milestone.stageNumber)}
                    disabled={status === "locked"}
                    className={`
                      relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center
                      font-bold text-lg transition-all duration-200 transform
                      ${getStageColor(status)}
                      ${isSelected ? "scale-110 ring-4 ring-blue-200" : ""}
                      ${
                        status !== "locked"
                          ? "hover:scale-105 cursor-pointer"
                          : "cursor-not-allowed"
                      }
                    `}
                  >
                    {milestone.isCompleted ? (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : status === "locked" ? (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      milestone.stageNumber
                    )}
                  </button>

                  {/* Stage Info */}
                  <div className="ml-6 flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {milestone.stageName}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {milestone.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-gray-500">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Level {milestone.requirements.level} required
                      </span>
                      {milestone.isCompleted && (
                        <span className="flex items-center text-green-600">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < milestones.length - 1 && (
                  <div
                    className={`
                      absolute left-8 top-16 w-0.5 h-8 border-l-2 border-dashed
                      ${getConnectorColor(status, nextStatus || "locked")}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Synergies Section */}
      {showSynergies &&
        path.synergies &&
        Object.keys(path.synergies).length > 0 && (
          <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Skill Synergies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(path.synergies).map(([skill, factor]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100"
                >
                  <span className="font-medium text-gray-700">{skill}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${factor * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-purple-600 font-medium">
                      +{Math.round(factor * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-purple-600 mt-3">
              Developing skills in {path.interestCategory} will boost your
              progress in these related areas.
            </p>
          </div>
        )}

      {/* Selected Stage Details */}
      {selectedStage !== null && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          {(() => {
            const milestone = milestones.find(
              (m) => m.stageNumber === selectedStage
            );
            if (!milestone) return null;

            return (
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Stage {milestone.stageNumber}: {milestone.stageName}
                </h3>
                <p className="text-blue-700 mb-3">{milestone.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-600">
                    <strong>Requirements:</strong> Level{" "}
                    {milestone.requirements.level} in {path.interestCategory}
                  </div>
                  {milestone.isUnlocked && !milestone.isCompleted && (
                    <button
                      onClick={() => onStageClick?.(milestone.stageNumber)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Start Stage
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
