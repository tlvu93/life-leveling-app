"use client";

import { useState } from "react";
import { SkillLevel, getSkillLevelName } from "@/types";

interface SkillAssessmentStepProps {
  interests: string[];
  subcategories: Record<string, string>;
  onNext: (levels: Record<string, SkillLevel>) => void;
  onBack: () => void;
  initialLevels?: Record<string, SkillLevel>;
}

const SKILL_LEVEL_DESCRIPTIONS = {
  [SkillLevel.NOVICE]: {
    title: "Novice",
    description: "Just starting out or curious to learn",
    icon: "🌱",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    selectedBg: "bg-green-100 border-green-400",
  },
  [SkillLevel.INTERMEDIATE]: {
    title: "Intermediate",
    description: "Have some experience and basic skills",
    icon: "🌿",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    selectedBg: "bg-blue-100 border-blue-400",
  },
  [SkillLevel.ADVANCED]: {
    title: "Advanced",
    description: "Quite skilled and experienced",
    icon: "🌳",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    selectedBg: "bg-purple-100 border-purple-400",
  },
  [SkillLevel.EXPERT]: {
    title: "Expert",
    description: "Highly skilled and knowledgeable",
    icon: "🏆",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    selectedBg: "bg-orange-100 border-orange-400",
  },
};

export function SkillAssessmentStep({
  interests,
  subcategories,
  onNext,
  onBack,
  initialLevels = {},
}: SkillAssessmentStepProps) {
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>(
    () => {
      // Initialize with provided levels or default to NOVICE
      const levels: Record<string, SkillLevel> = {};
      interests.forEach((interest) => {
        levels[interest] = initialLevels[interest] || SkillLevel.NOVICE;
      });
      return levels;
    }
  );

  const handleLevelChange = (interest: string, level: SkillLevel) => {
    setSkillLevels((prev) => ({
      ...prev,
      [interest]: level,
    }));
  };

  const handleNext = () => {
    onNext(skillLevels);
  };

  const allLevelsSet = interests.every(
    (interest) => skillLevels[interest] !== undefined
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          How would you rate your current skills? 📊
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Be honest about where you are right now. This helps us create a
          personalized experience for you.
        </p>
      </div>

      {/* Skill Level Legend */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Skill Level Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SKILL_LEVEL_DESCRIPTIONS).map(([level, desc]) => (
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
              <p className="text-sm text-gray-600">{desc.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interest Assessments */}
      <div className="space-y-6">
        {interests.map((interest) => {
          const currentLevel = skillLevels[interest];
          const subcategory = subcategories[interest];

          return (
            <div
              key={interest}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {interest}
                </h3>
                {subcategory && (
                  <p className="text-gray-600">Specialty: {subcategory}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {Object.entries(SKILL_LEVEL_DESCRIPTIONS).map(
                  ([level, desc]) => {
                    const levelNum = parseInt(level) as SkillLevel;
                    const isSelected = currentLevel === levelNum;

                    return (
                      <button
                        key={level}
                        onClick={() => handleLevelChange(interest, levelNum)}
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
                        <p className="text-sm text-gray-600">
                          {desc.description}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
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
              ? "Great! All skills assessed"
              : "Please rate all your interests"}
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
            Next: Set Commitment →
          </button>
        </div>
      </div>
    </div>
  );
}
