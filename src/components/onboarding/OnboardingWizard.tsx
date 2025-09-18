"use client";

import { useState } from "react";
import { InterestSelectionStep } from "./InterestSelectionStep";
import { SkillAssessmentStep } from "./SkillAssessmentStep";
import { CommitmentLevelStep } from "./CommitmentLevelStep";
import { OnboardingComplete } from "./OnboardingComplete";
import { ProgressIndicator } from "@/components/ui/ProgressIndicator";
import { AppLayout, Container } from "@/components/layout/AppLayout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkillLevel, CommitmentLevel } from "@/types";

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
    <AppLayout variant="playful">
      <Container size="lg" className="py-8">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          steps={STEPS}
          variant="playful"
          showDescriptions={true}
          className="mb-8"
        />

        {/* Main Content */}
        <div className="bg-card backdrop-blur-sm rounded-2xl shadow-large p-8 border border-border">
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
      </Container>
    </AppLayout>
  );
}
