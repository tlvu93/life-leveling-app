"use client";

import { useState } from "react";
import { SkillLevel } from "@/types";
import { SkillLevelCard } from "@/components/ui/skill-level-card";

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
    variant: "novice" as const,
  },
  [SkillLevel.INTERMEDIATE]: {
    title: "Intermediate",
    description: "Have some experience and basic skills",
    icon: "🌿",
    variant: "intermediate" as const,
  },
  [SkillLevel.ADVANCED]: {
    title: "Advanced",
    description: "Quite skilled and experienced",
    icon: "🌳",
    variant: "advanced" as const,
  },
  [SkillLevel.EXPERT]: {
    title: "Expert",
    description: "Highly skilled and knowledgeable",
    icon: "🏆",
    variant: "expert" as const,
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
        <h1 className="text-3xl font-bold text-foreground mb-4">
          How would you rate your current skills? 📊
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Be honest about where you are right now. This helps us create a
          personalized experience for you.
        </p>
      </div>

      {/* Skill Level Legend */}
      <div className="bg-muted/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Skill Level Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SKILL_LEVEL_DESCRIPTIONS).map(([level, desc]) => (
            <SkillLevelCard
              key={level}
              title={desc.title}
              description={desc.description}
              icon={desc.icon}
              variant={desc.variant}
              disabled
            />
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
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {interest}
                </h3>
                {subcategory && (
                  <p className="text-muted-foreground">
                    Specialty: {subcategory}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {Object.entries(SKILL_LEVEL_DESCRIPTIONS).map(
                  ([level, desc]) => {
                    const levelNum = parseInt(level) as SkillLevel;
                    const isSelected = currentLevel === levelNum;

                    return (
                      <SkillLevelCard
                        key={level}
                        title={desc.title}
                        description={desc.description}
                        icon={desc.icon}
                        variant={desc.variant}
                        isSelected={isSelected}
                        onClick={() => handleLevelChange(interest, levelNum)}
                      />
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
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
              ? "Great! All skills assessed"
              : "Please rate all your interests"}
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
            Next: Set Commitment →
          </button>
        </div>
      </div>
    </div>
  );
}
