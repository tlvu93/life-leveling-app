"use client";

import { useState } from "react";
import {
  SkillLevel,
  CommitmentLevel,
  getCommitmentLevelName,
  getSkillLevelName,
} from "@/types";

interface CommitmentLevelStepProps {
  interests: string[];
  subcategories: Record<string, string>;
  skillLevels: Record<string, SkillLevel>;
  onNext: (levels: Record<string, CommitmentLevel>) => void;
  onBack: () => void;
  initialLevels?: Record<string, CommitmentLevel>;
}

const COMMITMENT_LEVEL_DESCRIPTIONS = {
  [CommitmentLevel.CASUAL]: {
    title: "Casual",
    description: "I enjoy this for fun and relaxation",
    details: "Light engagement, no pressure, just for enjoyment",
    icon: "😊",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    selectedBg: "bg-green-100 border-green-400",
  },
  [CommitmentLevel.AVERAGE]: {
    title: "Average",
    description: "I want to improve steadily over time",
    details: "Regular practice, moderate goals, balanced approach",
    icon: "📈",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    selectedBg: "bg-blue-100 border-blue-400",
  },
  [CommitmentLevel.INVESTED]: {
    title: "Invested",
    description: "This is important to me and I want to excel",
    details: "Focused effort, clear goals, willing to challenge myself",
    icon: "🎯",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    selectedBg: "bg-purple-100 border-purple-400",
  },
  [CommitmentLevel.COMPETITIVE]: {
    title: "Competitive",
    description: "I want to be among the best in this area",
    details: "High dedication, ambitious goals, performance-focused",
    icon: "🏆",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    selectedBg: "bg-orange-100 border-orange-400",
  },
};

export function CommitmentLevelStep({
  interests,
  subcategories,
  skillLevels,
  onNext,
  onBack,
  initialLevels = {},
}: CommitmentLevelStepProps) {
  const [commitmentLevels, setCommitmentLevels] = useState<
    Record<string, CommitmentLevel>
  >(() => {
    // Initialize with provided levels or default to CASUAL
    const levels: Record<string, CommitmentLevel> = {};
    interests.forEach((interest) => {
      levels[interest] = initialLevels[interest] || CommitmentLevel.CASUAL;
    });
    return levels;
  });

  const handleLevelChange = (interest: string, level: CommitmentLevel) => {
    setCommitmentLevels((prev) => ({
      ...prev,
      [interest]: level,
    }));
  };

  const handleNext = () => {
    onNext(commitmentLevels);
  };

  const allLevelsSet = interests.every(
    (interest) => commitmentLevels[interest] !== undefined
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          How committed are you to each interest? 🎯
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your commitment level helps us tailor your experience. You can have
          different levels for different interests!
        </p>
      </div>

      {/* Commitment Level Legend */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Commitment Level Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(COMMITMENT_LEVEL_DESCRIPTIONS).map(
            ([level, desc]) => (
              <div
                key={level}
                className={`p-4 rounded-lg border-2 ${desc.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{desc.icon}</span>
                  <span className={`font-semibold ${desc.color}`}>
                    {desc.title}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{desc.description}</p>
                <p className="text-xs text-gray-600">{desc.details}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Interest Commitment Assessments */}
      <div className="space-y-6">
        {interests.map((interest) => {
          const currentLevel = commitmentLevels[interest];
          const subcategory = subcategories[interest];
          const skillLevel = skillLevels[interest];

          return (
            <div
              key={interest}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {interest}
                    </h3>
                    {subcategory && (
                      <p className="text-gray-600">Specialty: {subcategory}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Current Skill</div>
                    <div className="font-medium text-gray-700">
                      {getSkillLevelName(skillLevel)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(COMMITMENT_LEVEL_DESCRIPTIONS).map(
                  ([level, desc]) => {
                    const commitmentLevel = level as CommitmentLevel;
                    const isSelected = currentLevel === commitmentLevel;

                    return (
                      <button
                        key={level}
                        onClick={() =>
                          handleLevelChange(interest, commitmentLevel)
                        }
                        className={`
                        p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${
                          isSelected
                            ? `${desc.selectedBg} shadow-md transform scale-105`
                            : `${desc.bgColor} hover:shadow-sm hover:scale-102`
                        }
                      `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{desc.icon}</span>
                          <span className={`font-medium ${desc.color}`}>
                            {desc.title}
                          </span>
                          {isSelected && (
                            <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {desc.description}
                        </p>
                        <p className="text-xs text-gray-600">{desc.details}</p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Commitment Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(CommitmentLevel).map((level) => {
            const count = interests.filter(
              (interest) => commitmentLevels[interest] === level
            ).length;
            const desc = COMMITMENT_LEVEL_DESCRIPTIONS[level];

            if (count === 0) return null;

            return (
              <div key={level} className="text-center">
                <div className="text-2xl mb-1">{desc.icon}</div>
                <div className={`font-medium ${desc.color}`}>{desc.title}</div>
                <div className="text-sm text-gray-600">
                  {count} interest{count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-500 mb-2">
            {allLevelsSet
              ? "Perfect! Ready to complete your profile"
              : "Please set commitment levels for all interests"}
          </div>
          <button
            onClick={handleNext}
            disabled={!allLevelsSet}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${
                allLevelsSet
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Complete Profile →
          </button>
        </div>
      </div>
    </div>
  );
}
