"use client";

import {
  SkillLevel,
  CommitmentLevel,
  getSkillLevelName,
  getCommitmentLevelName,
} from "@/types";

interface OnboardingCompleteProps {
  interests: string[];
  subcategories: Record<string, string>;
  skillLevels: Record<string, SkillLevel>;
  commitmentLevels: Record<string, CommitmentLevel>;
  onComplete: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const COMMITMENT_ICONS = {
  [CommitmentLevel.CASUAL]: "😊",
  [CommitmentLevel.AVERAGE]: "📈",
  [CommitmentLevel.INVESTED]: "🎯",
  [CommitmentLevel.COMPETITIVE]: "🏆",
};

const SKILL_ICONS = {
  [SkillLevel.NOVICE]: "🌱",
  [SkillLevel.INTERMEDIATE]: "🌿",
  [SkillLevel.ADVANCED]: "🌳",
  [SkillLevel.EXPERT]: "🏆",
};

export function OnboardingComplete({
  interests,
  subcategories,
  skillLevels,
  commitmentLevels,
  onComplete,
  onBack,
  isLoading = false,
}: OnboardingCompleteProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Your Profile is Ready!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Here&apos;s a summary of your interests and goals. You can always
          update these later in your profile settings.
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-primary/10 rounded-xl p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          Your Life Leveling Profile
        </h2>

        <div className="grid gap-6">
          {interests.map((interest) => {
            const subcategory = subcategories[interest];
            const skillLevel = skillLevels[interest];
            const commitmentLevel = commitmentLevels[interest];

            return (
              <div
                key={interest}
                className="bg-card rounded-lg p-6 shadow-sm border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {interest}
                    </h3>
                    {subcategory && (
                      <p className="text-muted-foreground mb-3">
                        Specialty: {subcategory}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skill Level */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{SKILL_ICONS[skillLevel]}</span>
                    <div>
                      <div className="font-medium text-foreground">
                        Current Skill: {getSkillLevelName(skillLevel)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {skillLevel === SkillLevel.NOVICE &&
                          "Just starting out"}
                        {skillLevel === SkillLevel.INTERMEDIATE &&
                          "Building experience"}
                        {skillLevel === SkillLevel.ADVANCED && "Quite skilled"}
                        {skillLevel === SkillLevel.EXPERT &&
                          "Highly experienced"}
                      </div>
                    </div>
                  </div>

                  {/* Commitment Level */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">
                      {COMMITMENT_ICONS[commitmentLevel]}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                        Commitment: {getCommitmentLevelName(commitmentLevel)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {commitmentLevel === CommitmentLevel.CASUAL &&
                          "For fun and relaxation"}
                        {commitmentLevel === CommitmentLevel.AVERAGE &&
                          "Steady improvement"}
                        {commitmentLevel === CommitmentLevel.INVESTED &&
                          "Focused growth"}
                        {commitmentLevel === CommitmentLevel.COMPETITIVE &&
                          "High performance"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-accent/10 rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          What happens next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-medium text-foreground mb-1">
              LifeStat Matrix
            </h4>
            <p className="text-sm text-muted-foreground">
              See your skills visualized in a dynamic radar chart
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-medium text-foreground mb-1">Set Goals</h4>
            <p className="text-sm text-muted-foreground">
              Create promises to your future self in Adventure Mode
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔮</div>
            <h4 className="font-medium text-foreground mb-1">Explore Paths</h4>
            <p className="text-sm text-muted-foreground">
              Simulate different growth scenarios in Architect Mode
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-3 text-muted-foreground border border-border rounded-lg hover:bg-muted hover:border-border/60 transition-colors shadow-sm hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <button
          onClick={onComplete}
          disabled={isLoading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer border
            ${
              isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg border-primary/20 hover:border-primary/30"
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              Creating Profile...
            </>
          ) : (
            <>Complete Setup 🚀</>
          )}
        </button>
      </div>
    </div>
  );
}
