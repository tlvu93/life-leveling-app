"use client";

import { useState } from "react";
import {
  RetrospectiveType,
  Interest,
  Goal,
  SkillLevel,
  GoalStatus,
} from "@/types";

interface RetrospectiveWizardProps {
  type: RetrospectiveType;
  userInterests: Interest[];
  userGoals: Goal[];
  onRetrospectiveCreate: (retrospectiveData: {
    type: RetrospectiveType;
    insights: Record<string, any>;
    skillUpdates: Record<string, SkillLevel>;
    goalsReviewed: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function RetrospectiveWizard({
  type,
  userInterests,
  userGoals,
  onRetrospectiveCreate,
  onCancel,
}: RetrospectiveWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    insights: {} as Record<string, any>,
    skillUpdates: {} as Record<string, SkillLevel>,
    goalsReviewed: [] as string[],
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
    setIsSubmitting(true);
    try {
      await onRetrospectiveCreate({
        type,
        insights: formData.insights,
        skillUpdates: formData.skillUpdates,
        goalsReviewed: formData.goalsReviewed,
      });
    } catch (error) {
      console.error("Error creating retrospective:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const getTypeLabel = (type: RetrospectiveType) => {
    switch (type) {
      case RetrospectiveType.WEEKLY:
        return "Weekly";
      case RetrospectiveType.MONTHLY:
        return "Monthly";
      case RetrospectiveType.YEARLY:
        return "Yearly";
      default:
        return type;
    }
  };

  const getTypeEmoji = (type: RetrospectiveType) => {
    switch (type) {
      case RetrospectiveType.WEEKLY:
        return "📅";
      case RetrospectiveType.MONTHLY:
        return "🗓️";
      case RetrospectiveType.YEARLY:
        return "📆";
      default:
        return "🔄";
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ReflectionStep
            type={type}
            insights={formData.insights}
            onInsightsUpdate={(insights) => updateFormData({ insights })}
          />
        );
      case 2:
        return (
          <SkillUpdateStep
            userInterests={userInterests}
            skillUpdates={formData.skillUpdates}
            onSkillUpdatesChange={(skillUpdates) =>
              updateFormData({ skillUpdates })
            }
          />
        );
      case 3:
        return (
          <GoalReviewStep
            userGoals={userGoals}
            goalsReviewed={formData.goalsReviewed}
            onGoalsReviewedChange={(goalsReviewed) =>
              updateFormData({ goalsReviewed })
            }
          />
        );
      case 4:
        return (
          <SummaryStep
            type={type}
            insights={formData.insights}
            skillUpdates={formData.skillUpdates}
            goalsReviewed={formData.goalsReviewed}
            userInterests={userInterests}
            userGoals={userGoals}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {getTypeEmoji(type)} {getTypeLabel(type)} Retrospective
          </h2>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <p className="text-gray-600">
          Take a moment to reflect on your progress and growth
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Complete Retrospective"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
interface ReflectionStepProps {
  type: RetrospectiveType;
  insights: Record<string, any>;
  onInsightsUpdate: (insights: Record<string, any>) => void;
}

function ReflectionStep({
  type,
  insights,
  onInsightsUpdate,
}: ReflectionStepProps) {
  const getPrompts = (type: RetrospectiveType) => {
    switch (type) {
      case RetrospectiveType.WEEKLY:
        return [
          {
            key: "highlights",
            question: "What were your biggest wins this week?",
            placeholder: "Share what you're proud of accomplishing...",
          },
          {
            key: "challenges",
            question: "What challenges did you face?",
            placeholder: "What was difficult or didn't go as planned?",
          },
          {
            key: "learnings",
            question: "What did you learn about yourself?",
            placeholder:
              "Any insights or discoveries about your interests or abilities?",
          },
        ];
      case RetrospectiveType.MONTHLY:
        return [
          {
            key: "progress",
            question: "How did you grow this month?",
            placeholder: "Reflect on your development and progress...",
          },
          {
            key: "surprises",
            question: "What surprised you this month?",
            placeholder: "Unexpected discoveries, interests, or abilities?",
          },
          {
            key: "focus",
            question: "What deserves more attention next month?",
            placeholder: "Areas you want to prioritize or explore further...",
          },
        ];
      case RetrospectiveType.YEARLY:
        return [
          {
            key: "transformation",
            question: "How have you transformed this year?",
            placeholder: "Reflect on your biggest changes and growth...",
          },
          {
            key: "proudest",
            question: "What are you most proud of?",
            placeholder: "Your greatest achievements and breakthroughs...",
          },
          {
            key: "vision",
            question: "What's your vision for next year?",
            placeholder: "Dreams, goals, and aspirations for the future...",
          },
        ];
      default:
        return [];
    }
  };

  const prompts = getPrompts(type);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Time for Reflection</h3>
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div key={prompt.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {prompt.question}
            </label>
            <textarea
              value={insights[prompt.key] || ""}
              onChange={(e) =>
                onInsightsUpdate({
                  ...insights,
                  [prompt.key]: e.target.value,
                })
              }
              placeholder={prompt.placeholder}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkillUpdateStepProps {
  userInterests: Interest[];
  skillUpdates: Record<string, SkillLevel>;
  onSkillUpdatesChange: (skillUpdates: Record<string, SkillLevel>) => void;
}

function SkillUpdateStep({
  userInterests,
  skillUpdates,
  onSkillUpdatesChange,
}: SkillUpdateStepProps) {
  const handleSkillUpdate = (category: string, newLevel: SkillLevel) => {
    onSkillUpdatesChange({
      ...skillUpdates,
      [category]: newLevel,
    });
  };

  const getSkillLevelName = (level: SkillLevel) => {
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
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Update Your Skills</h3>
      <p className="text-gray-600 mb-6">
        Have any of your skill levels changed? Update them here based on your
        recent progress.
      </p>

      <div className="space-y-4">
        {userInterests.map((interest) => (
          <div
            key={interest.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">
                  {interest.category}
                </h4>
                {interest.subcategory && (
                  <p className="text-sm text-gray-600">
                    {interest.subcategory}
                  </p>
                )}
                <p className="text-sm text-blue-600">
                  Current: {getSkillLevelName(interest.currentLevel)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                SkillLevel.NOVICE,
                SkillLevel.INTERMEDIATE,
                SkillLevel.ADVANCED,
                SkillLevel.EXPERT,
              ].map((level) => (
                <button
                  key={level}
                  onClick={() => handleSkillUpdate(interest.category, level)}
                  className={`p-2 text-center border-2 rounded-lg transition-all ${
                    (skillUpdates[interest.category] ||
                      interest.currentLevel) === level
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {getSkillLevelName(level)}
                  </div>
                  <div className="text-xs text-gray-500">Level {level}</div>
                </button>
              ))}
            </div>

            {skillUpdates[interest.category] &&
              skillUpdates[interest.category] !== interest.currentLevel && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Will update from {getSkillLevelName(interest.currentLevel)}{" "}
                  to {getSkillLevelName(skillUpdates[interest.category])}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface GoalReviewStepProps {
  userGoals: Goal[];
  goalsReviewed: string[];
  onGoalsReviewedChange: (goalsReviewed: string[]) => void;
}

function GoalReviewStep({
  userGoals,
  goalsReviewed,
  onGoalsReviewedChange,
}: GoalReviewStepProps) {
  const activeGoals = userGoals.filter(
    (goal) => goal.status === GoalStatus.ACTIVE
  );

  const handleGoalToggle = (goalId: string) => {
    if (goalsReviewed.includes(goalId)) {
      onGoalsReviewedChange(goalsReviewed.filter((id) => id !== goalId));
    } else {
      onGoalsReviewedChange([...goalsReviewed, goalId]);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Review Your Goals</h3>
      <p className="text-gray-600 mb-6">
        Which goals did you work on or think about during this period?
      </p>

      {activeGoals.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600">No active goals to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                goalsReviewed.includes(goal.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleGoalToggle(goal.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {goal.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{goal.interestCategory}</span>
                    <span>•</span>
                    <span>{goal.timeframe}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={goalsReviewed.includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SummaryStepProps {
  type: RetrospectiveType;
  insights: Record<string, any>;
  skillUpdates: Record<string, SkillLevel>;
  goalsReviewed: string[];
  userInterests: Interest[];
  userGoals: Goal[];
}

function SummaryStep({
  type,
  insights,
  skillUpdates,
  goalsReviewed,
  userInterests,
  userGoals,
}: SummaryStepProps) {
  const getSkillLevelName = (level: SkillLevel) => {
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
  };

  const skillChanges = Object.entries(skillUpdates).filter(
    ([category, newLevel]) => {
      const interest = userInterests.find((i) => i.category === category);
      return interest && interest.currentLevel !== newLevel;
    }
  );

  const reviewedGoals = userGoals.filter((goal) =>
    goalsReviewed.includes(goal.id)
  );

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Retrospective Summary</h3>

      <div className="space-y-6">
        {/* Insights Summary */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Your Reflections</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {Object.entries(insights).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="mb-3 last:mb-0">
                    <p className="text-sm font-medium text-gray-700 capitalize mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </p>
                    <p className="text-gray-600 text-sm">{value}</p>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Skill Updates Summary */}
        {skillChanges.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              Skill Level Updates
            </h4>
            <div className="bg-green-50 rounded-lg p-4">
              {skillChanges.map(([category, newLevel]) => {
                const interest = userInterests.find(
                  (i) => i.category === category
                );
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="font-medium">{category}</span>
                    <span className="text-green-600">
                      {getSkillLevelName(interest!.currentLevel)} →{" "}
                      {getSkillLevelName(newLevel)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals Reviewed Summary */}
        {reviewedGoals.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Goals Reviewed</h4>
            <div className="bg-blue-50 rounded-lg p-4">
              {reviewedGoals.map((goal) => (
                <div key={goal.id} className="py-2">
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-sm text-gray-600">
                    {goal.interestCategory}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Remember:</strong> This retrospective is about growth, not
            perfection. Every reflection helps you understand yourself better
            and guides your future journey.
          </p>
        </div>
      </div>
    </div>
  );
}
