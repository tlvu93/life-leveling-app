"use client";

import React, { useState, useEffect } from "react";
import { Interest, CommitmentLevel } from "@/types";
import { CommitmentLevelUpdater } from "./CommitmentLevelUpdater";

interface ComparisonManagementProps {
  userId: string;
}

export function ComparisonManagement({ userId }: ComparisonManagementProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserInterests();
  }, [userId]);

  const loadUserInterests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data.interests) {
        setInterests(data.data.interests);
        setError(null);
      } else {
        setError(data.error || "Failed to load interests");
      }
    } catch (err) {
      setError("Failed to load interests");
      console.error("Error loading interests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitmentUpdate = async (
    interestId: string,
    newCommitmentLevel: CommitmentLevel
  ) => {
    try {
      const response = await fetch(`/api/interests/${interestId}/commitment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commitmentLevel: newCommitmentLevel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setInterests((prev) =>
          prev.map((interest) =>
            interest.id === interestId
              ? { ...interest, intentLevel: newCommitmentLevel }
              : interest
          )
        );
      } else {
        throw new Error(data.error || "Failed to update commitment level");
      }
    } catch (error) {
      console.error("Error updating commitment level:", error);
      throw error; // Re-throw to let the component handle it
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your interests...</span>
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
                Error loading interests
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadUserInterests}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Your Comparison Settings
        </h1>
        <p className="text-gray-600">
          Update your commitment levels to change which peer groups you're
          compared with
        </p>
      </div>

      {interests.length === 0 ? (
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No interests yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add some interests to your profile to start managing comparison
            settings
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
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
                <h3 className="font-medium text-blue-900 mb-1">
                  How Commitment Levels Affect Comparisons
                </h3>
                <p className="text-sm text-blue-800">
                  Changing your commitment level will move you to a different
                  peer group. You'll only be compared with others who have the
                  same commitment level for each interest.
                </p>
              </div>
            </div>
          </div>

          {interests.map((interest) => (
            <CommitmentLevelUpdater
              key={interest.id}
              interest={interest}
              onUpdate={handleCommitmentUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
