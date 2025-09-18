"use client";

import { useState } from "react";
import {
  GoalType,
  Timeframe,
  SkillLevel,
  Interest,
  GoalFormData,
} from "@/types";

interface GoalCreationWizardProps {
  userInterests: Interest[];
  onGoalCreate: (goalData: GoalFormData) => Promise<void>;
  onCancel: () => void;
}

export default function GoalCreationWizard({
  userInterests,
  onGoalCreate,
  onCancel,
}: GoalCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<GoalFormData>>({
    goalType: GoalType.SKILL_INCREASE,
    timeframe: Timeframe.MONTHLY,
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    try {
      await onGoalCreate(formData as GoalFormData);
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    return !!(
      formData.interestCategory &&
      formData.goalType &&
      formData.title &&
      formData.description &&
      formData.timeframe
    );
  };

  const updateFormData = (updates: Partial<GoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GoalTypeStep
            selectedType={formData.goalType}
            onTypeSelect={(type) => updateFormData({ goalType: type })}
          />
        );
      case 2:
        return (
          <InterestSelectionStep
            userInterests={userInterests}
            selectedCategory={formData.interestCategory}
            onCategorySelect={(category) =>
              updateFormData({ interestCategory: category })
            }
          />
        );
      case 3:
        return (
          <GoalDetailsStep formData={formData} onUpdate={updateFormData} />
        );
      case 4:
        return (
          <TimeframeStep
            selectedTimeframe={formData.timeframe}
            targetLevel={formData.targetLevel}
            goalType={formData.goalType}
            onTimeframeSelect={(timeframe) => updateFormData({ timeframe })}
            onTargetLevelSelect={(targetLevel) =>
              updateFormData({ targetLevel })
            }
            onTargetDateSelect={(targetDate) => updateFormData({ targetDate })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-6 border border-border">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-foreground">
            Create New Goal
          </h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={!canProceedToNext()}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Goal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        return !!formData.goalType;
      case 2:
        return !!formData.interestCategory;
      case 3:
        return !!(formData.title && formData.description);
      case 4:
        return !!formData.timeframe;
      default:
        return false;
    }
  }
}

// Step Components
interface GoalTypeStepProps {
  selectedType?: GoalType;
  onTypeSelect: (type: GoalType) => void;
}

function GoalTypeStep({ selectedType, onTypeSelect }: GoalTypeStepProps) {
  const goalTypes = [
    {
      type: GoalType.SKILL_INCREASE,
      title: "Skill Level Increase",
      description:
        "Level up your skills from your current level to a higher one",
      icon: "📈",
      example: "Go from Intermediate to Advanced in Guitar",
    },
    {
      type: GoalType.PROJECT_COMPLETION,
      title: "Project Completion",
      description: "Complete a specific project or achievement",
      icon: "🎯",
      example: "Build a personal website or learn 10 new songs",
    },
    {
      type: GoalType.BROAD_PROMISE,
      title: "Broad Promise",
      description: "Make a general commitment to yourself about growth",
      icon: "💫",
      example: "Practice music more regularly or explore new art techniques",
    },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        What type of goal do you want to set?
      </h3>
      <div className="space-y-4">
        {goalTypes.map((goalType) => (
          <button
            key={goalType.type}
            onClick={() => onTypeSelect(goalType.type)}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
              selectedType === goalType.type
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{goalType.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-800">
                  {goalType.title}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {goalType.description}
                </p>
                <p className="text-blue-600 text-sm mt-2 italic">
                  Example: {goalType.example}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface InterestSelectionStepProps {
  userInterests: Interest[];
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
}

function InterestSelectionStep({
  userInterests,
  selectedCategory,
  onCategorySelect,
}: InterestSelectionStepProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Which interest area is this goal for?
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {userInterests.map((interest) => (
          <button
            key={interest.id}
            onClick={() => onCategorySelect(interest.category)}
            className={`p-4 text-left border-2 rounded-lg transition-all ${
              selectedCategory === interest.category
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div>
              <h4 className="font-semibold text-gray-800">
                {interest.category}
              </h4>
              {interest.subcategory && (
                <p className="text-gray-600 text-sm">{interest.subcategory}</p>
              )}
              <p className="text-blue-600 text-sm mt-1">
                Current Level: {getSkillLevelName(interest.currentLevel)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface GoalDetailsStepProps {
  formData: Partial<GoalFormData>;
  onUpdate: (updates: Partial<GoalFormData>) => void;
}

function GoalDetailsStep({ formData, onUpdate }: GoalDetailsStepProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Tell us about your goal</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Title *
          </label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Give your goal a catchy name..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what you want to achieve and why it matters to you..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

interface TimeframeStepProps {
  selectedTimeframe?: Timeframe;
  targetLevel?: SkillLevel;
  goalType?: GoalType;
  onTimeframeSelect: (timeframe: Timeframe) => void;
  onTargetLevelSelect: (level: SkillLevel) => void;
  onTargetDateSelect: (date: Date) => void;
}

function TimeframeStep({
  selectedTimeframe,
  targetLevel,
  goalType,
  onTimeframeSelect,
  onTargetLevelSelect,
  onTargetDateSelect,
}: TimeframeStepProps) {
  const timeframes = [
    {
      value: Timeframe.WEEKLY,
      label: "Weekly",
      description: "Complete within a week",
    },
    {
      value: Timeframe.MONTHLY,
      label: "Monthly",
      description: "Complete within a month",
    },
    {
      value: Timeframe.YEARLY,
      label: "Yearly",
      description: "Complete within a year",
    },
  ];

  const skillLevels = [
    { value: SkillLevel.NOVICE, label: "Novice" },
    { value: SkillLevel.INTERMEDIATE, label: "Intermediate" },
    { value: SkillLevel.ADVANCED, label: "Advanced" },
    { value: SkillLevel.EXPERT, label: "Expert" },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        When do you want to achieve this?
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Timeframe *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => onTimeframeSelect(timeframe.value)}
                className={`p-3 text-center border-2 rounded-lg transition-all ${
                  selectedTimeframe === timeframe.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-800">
                  {timeframe.label}
                </div>
                <div className="text-sm text-gray-600">
                  {timeframe.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {goalType === GoalType.SKILL_INCREASE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Skill Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {skillLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => onTargetLevelSelect(level.value)}
                  className={`p-2 text-center border-2 rounded-lg transition-all ${
                    targetLevel === level.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{level.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Target Date (Optional)
          </label>
          <input
            type="date"
            onChange={(e) => onTargetDateSelect(new Date(e.target.value))}
            min={new Date().toISOString().split("T")[0]}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function getSkillLevelName(level: SkillLevel): string {
  switch (level) {
    case SkillLevel.NOVICE:
      return "Novice";
    case SkillLevel.INTERMEDIATE:
      return "Intermediate";
    case SkillLevel.ADVANCED:
      return "Advanced";
    case SkillLevel.EXPERT:
      return "Expert";
    default:
      return "Unknown";
  }
}
