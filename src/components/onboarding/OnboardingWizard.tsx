"use client";

import { useState } from "react";
import { InterestSelectionStep } from "./InterestSelectionStep";
import { SkillAssessmentStep } from "./SkillAssessmentStep";
import { CommitmentLevelStep } from "./CommitmentLevelStep";
import { OnboardingComplete } from "./OnboardingComplete";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkillLevel, CommitmentLevel, UserProfile } from "@/types";

export interface OnboardingInterest {
  category: string;
  subcategory?: string;
  level: SkillLevel;
  intent: CommitmentLevel;
}

export interface OnboardingData {
  interests: OnboardingInterest[];
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  isLoading?: boolean;
  existingProfile?: UserProfile | null; // Existing profile data for editing
  isEditMode?: boolean; // Whether we're editing an existing profile
}

const STEPS = [
  {
    id: 1,
    title: "Select Interests",
    description: "Choose what you're passionate about",
  },
  {
    id: 2,
    title: "Assess Skills",
    description: "Rate your current skill levels",
  },
  {
    id: 3,
    title: "Set Commitment",
    description: "Choose your commitment level",
  },
  { id: 4, title: "Complete", description: "Finish your profile setup" },
];

export function OnboardingWizard({
  onComplete,
  isLoading = false,
  existingProfile,
  isEditMode = false,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestSubcategories, setInterestSubcategories] = useState<
    Record<string, string>
  >({});
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>(
    {}
  );
  const [commitmentLevels, setCommitmentLevels] = useState<
    Record<string, CommitmentLevel>
  >({});

  // Initialize with existing profile data if available. This re-derives the
  // wizard's local state whenever a *new* `existingProfile` is passed in
  // (identity change), while preserving in-progress edits across re-renders
  // in between.
  const [syncedProfile, setSyncedProfile] = useState(existingProfile);
  if (existingProfile !== syncedProfile) {
    setSyncedProfile(existingProfile);

    if (existingProfile && existingProfile.interests) {
      const interests = existingProfile.interests.map(
        (interest) => interest.category
      );
      const subcategories: Record<string, string> = {};
      const skills: Record<string, SkillLevel> = {};
      const commitments: Record<string, CommitmentLevel> = {};

      existingProfile.interests.forEach((interest) => {
        if (interest.subcategory) {
          subcategories[interest.category] = interest.subcategory;
        }
        skills[interest.category] = interest.currentLevel;
        commitments[interest.category] = interest.intentLevel;
      });

      setSelectedInterests(interests);
      setInterestSubcategories(subcategories);
      setSkillLevels(skills);
      setCommitmentLevels(commitments);
    }
  }

  const handleInterestSelection = (
    interests: string[],
    subcategories: Record<string, string>
  ) => {
    setSelectedInterests(interests);
    setInterestSubcategories(subcategories);

    // Initialize skill levels for selected interests
    const initialSkillLevels: Record<string, SkillLevel> = {};
    interests.forEach((interest) => {
      initialSkillLevels[interest] = SkillLevel.NOVICE;
    });
    setSkillLevels(initialSkillLevels);

    // Initialize commitment levels for selected interests
    const initialCommitmentLevels: Record<string, CommitmentLevel> = {};
    interests.forEach((interest) => {
      initialCommitmentLevels[interest] = CommitmentLevel.CASUAL;
    });
    setCommitmentLevels(initialCommitmentLevels);

    setCurrentStep(2);
  };

  const handleSkillAssessment = (levels: Record<string, SkillLevel>) => {
    setSkillLevels(levels);
    setCurrentStep(3);
  };

  const handleCommitmentSelection = (
    levels: Record<string, CommitmentLevel>
  ) => {
    setCommitmentLevels(levels);
    setCurrentStep(4);
  };

  const handleComplete = async () => {
    const onboardingData: OnboardingData = {
      interests: selectedInterests.map((category) => ({
        category,
        subcategory: interestSubcategories[category],
        level: skillLevels[category],
        intent: commitmentLevels[category],
      })),
    };

    await onComplete(onboardingData);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="shadow-lg border-0 bg-white rounded-xl overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-4 p-8 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h1 className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                {isEditMode ? "Edit Your Profile" : "Welcome to Life Leveling!"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEditMode
                  ? "Update your interests, skills, and commitment levels"
                  : "Let's set up your personal growth journey"}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((currentStep / STEPS.length) * 100)}% complete
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 pt-0 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-muted-foreground">
                {STEPS[currentStep - 1].description}
              </p>
            </div>
            {currentStep === 1 && (
              <InterestSelectionStep
                onNext={handleInterestSelection}
                initialSelected={selectedInterests}
                initialSubcategories={interestSubcategories}
              />
            )}

            {currentStep === 2 && (
              <SkillAssessmentStep
                interests={selectedInterests}
                subcategories={interestSubcategories}
                onNext={handleSkillAssessment}
                onBack={handleBack}
                initialLevels={skillLevels}
              />
            )}

            {currentStep === 3 && (
              <CommitmentLevelStep
                interests={selectedInterests}
                subcategories={interestSubcategories}
                skillLevels={skillLevels}
                onNext={handleCommitmentSelection}
                onBack={handleBack}
                initialLevels={commitmentLevels}
              />
            )}

            {currentStep === 4 && (
              <OnboardingComplete
                interests={selectedInterests}
                subcategories={interestSubcategories}
                skillLevels={skillLevels}
                commitmentLevels={commitmentLevels}
                onComplete={handleComplete}
                onBack={handleBack}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
