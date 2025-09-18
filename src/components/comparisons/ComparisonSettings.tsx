"use client";

import React, { useState } from "react";

interface ComparisonSettingsProps {
  userId: string;
  hasOptedIn: boolean;
  onOptInChange: (optedIn: boolean) => void;
  onClose: () => void;
}

export function ComparisonSettings({
  userId,
  hasOptedIn,
  onOptInChange,
  onClose,
}: ComparisonSettingsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onOptInChange(!hasOptedIn);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Peer Comparison Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Peer Comparisons
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasOptedIn
                      ? "You're currently sharing anonymous data for peer comparisons"
                      : "You're not currently participating in peer comparisons"}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      hasOptedIn ? "bg-blue-600" : "bg-gray-200"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasOptedIn ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                How Peer Comparisons Work
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Anonymous Grouping:</strong> You're grouped with
                      other learners who have similar age ranges, interests, and
                      commitment levels.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Percentile Ranking:</strong> We calculate where
                      your skill level falls compared to your peer group (e.g.,
                      "75th percentile").
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Encouraging Messages:</strong> You receive
                      positive, growth-focused feedback designed to motivate
                      continued learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Your Privacy is Protected
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-800">
                      No personal information is ever shared
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-800">
                      Only aggregated, anonymous statistics are used
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-800">
                      You can opt out at any time
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-800">
                      Data is stored securely and never sold
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commitment Level Details */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Commitment Level Comparisons
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                You're only compared with peers who have the same commitment
                level for each interest:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="font-medium text-green-800 text-sm">
                    Casual
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Exploring at your own pace, basic comparisons
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-800 text-sm">
                    Average
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Regular practice, moderate detail level
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="font-medium text-purple-800 text-sm">
                    Invested
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    Dedicated growth, detailed comparisons
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="font-medium text-red-800 text-sm">
                    Competitive
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    High performance focus, comprehensive details
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Benefits of Peer Comparisons
              </h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Understand your progress in context
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Get motivated by positive, encouraging feedback
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Celebrate your achievements and growth
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Stay motivated on your learning journey
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {!hasOptedIn && (
              <button
                onClick={handleToggle}
                disabled={isUpdating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Enabling..." : "Enable Comparisons"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
