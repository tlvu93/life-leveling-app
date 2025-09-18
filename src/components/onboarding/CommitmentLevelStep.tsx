"use client";

import { useState } from "react";
import {
  SkillLevel,
  CommitmentLevel,
  getCommitmentLevelName,
  getSkillLevelName,
} from "@/types";
import { CommitmentLevelCard } from "@/components/ui/commitment-level-card";

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
    variant: "casual" as const,
  },
  [CommitmentLevel.AVERAGE]: {
    title: "Average",
    description: "I want to improve steadily over time",
    details: "Regular practice, moderate goals, balanced approach",
    icon: "📈",
    variant: "average" as const,
  },
  [CommitmentLevel.INVESTED]: {
    title: "Invested",
    description: "This is important to me and I want to excel",
    details: "Focused effort, clear goals, willing to challenge myself",
    icon: "🎯",
    variant: "invested" as const,
  },
  [CommitmentLevel.COMPETITIVE]: {
    title: "Competitive",
    description: "I want to be among the best in this area",
    details: "High dedication, ambitious goals, performance-focused",
    icon: "🏆",
    variant: "competitive" as const,
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
        <h1 className="text-3xl font-bold text-foreground mb-4">
          How committed are you to each interest? 🎯
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your commitment level helps us tailor your experience. You can have
          different levels for different interests!
        </p>
      </div>

      {/* Commitment Level Legend */}
      <div className="bg-muted/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Commitment Level Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(COMMITMENT_LEVEL_DESCRIPTIONS).map(
            ([level, desc]) => (
              <CommitmentLevelCard
                key={level}
                title={desc.title}
                description={desc.description}
                details={desc.details}
                icon={desc.icon}
                variant={desc.variant}
                disabled
              />
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
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {interest}
                    </h3>
                    {subcategory && (
                      <p className="text-muted-foreground">
                        Specialty: {subcategory}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Current Skill
                    </div>
                    <div className="font-medium text-foreground">
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
                      <CommitmentLevelCard
                        key={level}
                        title={desc.title}
                        description={desc.description}
                        details={desc.details}
                        icon={desc.icon}
                        variant={desc.variant}
                        isSelected={isSelected}
                        onClick={() =>
                          handleLevelChange(interest, commitmentLevel)
                        }
                      />
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-primary/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
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
                <div className="text-sm text-muted-foreground">
                  {count} interest{count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <button
          onClick={onBack}
          className="px-6 py-3 text-muted-foreground border border-border rounded-lg hover:bg-muted hover:border-border/60 transition-colors shadow-sm hover:shadow cursor-pointer"
        >
          ← Back
        </button>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">
            {allLevelsSet
              ? "Perfect! Ready to complete your profile"
              : "Please set commitment levels for all interests"}
          </div>
          <button
            onClick={handleNext}
            disabled={!allLevelsSet}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200 border
              ${
                allLevelsSet
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg border-primary/20 hover:border-primary/30 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed border-border"
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
