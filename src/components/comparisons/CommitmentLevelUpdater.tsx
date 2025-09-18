"use client";

import React, { useState } from "react";
import { CommitmentLevel, Interest } from "@/types";

interface CommitmentLevelUpdaterProps {
  interest: Interest;
  onUpdate: (
    interestId: string,
    newCommitmentLevel: CommitmentLevel
  ) => Promise<void>;
}

export function CommitmentLevelUpdater({
  interest,
  onUpdate,
}: CommitmentLevelUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CommitmentLevel | null>(
    null
  );

  const commitmentLevels = [
    {
      level: CommitmentLevel.CASUAL,
      name: "Casual",
      description: "Exploring at your own pace, no pressure",
      icon: "🌱",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    {
      level: CommitmentLevel.AVERAGE,
      name: "Average",
      description: "Regular practice and steady progress",
      icon: "🚀",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      level: CommitmentLevel.INVESTED,
      name: "Invested",
      description: "Dedicated growth with focused effort",
      icon: "💪",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      level: CommitmentLevel.COMPETITIVE,
      name: "Competitive",
      description: "High performance and excellence focused",
      icon: "🏆",
      color: "bg-red-100 text-red-800 border-red-200",
    },
  ];

  const handleLevelSelect = (level: CommitmentLevel) => {
    if (level === interest.intentLevel) {
      return; // No change needed
    }
    setSelectedLevel(level);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedLevel) return;

    setIsUpdating(true);
    try {
      await onUpdate(interest.id, selectedLevel);
      setShowConfirmation(false);
      setSelectedLevel(null);
    } catch (error) {
      console.error("Error updating commitment level:", error);
      // Handle error (could show toast notification)
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedLevel(null);
  };

  const getCurrentLevelInfo = () => {
    return commitmentLevels.find(
      (level) => level.level === interest.intentLevel
    );
  };

  const getSelectedLevelInfo = () => {
    return commitmentLevels.find((level) => level.level === selectedLevel);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">{interest.category}</h3>
          <p className="text-sm text-gray-600">
            Current commitment: {getCurrentLevelInfo()?.name}
          </p>
        </div>
        <div className="text-2xl">{getCurrentLevelInfo()?.icon}</div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600 mb-3">
          Changing your commitment level will update your peer comparison group:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {commitmentLevels.map((levelInfo) => (
            <button
              key={levelInfo.level}
              onClick={() => handleLevelSelect(levelInfo.level)}
              disabled={isUpdating}
              className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                interest.intentLevel === levelInfo.level
                  ? `${levelInfo.color} border-current`
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              } ${
                isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{levelInfo.icon}</span>
                <span className="font-medium text-sm">{levelInfo.name}</span>
              </div>
              <p className="text-xs opacity-75">{levelInfo.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Commitment Level?
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">From:</div>
                  <div className="text-sm text-gray-600">
                    {getCurrentLevelInfo()?.icon} {getCurrentLevelInfo()?.name}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">To:</div>
                  <div className="text-sm text-gray-600">
                    {getSelectedLevelInfo()?.icon}{" "}
                    {getSelectedLevelInfo()?.name}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      This will update your peer comparison group
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      You&apos;ll be compared with other{" "}
                      {getSelectedLevelInfo()?.name.toLowerCase()} learners in{" "}
                      {interest.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
