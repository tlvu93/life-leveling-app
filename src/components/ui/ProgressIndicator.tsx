"use client";

import React from "react";
import { cn } from "@/lib/ui-utils";

export interface ProgressStep {
  id: number;
  title: string;
  description?: string;
  completed?: boolean;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  variant?: "default" | "playful" | "minimal";
  orientation?: "horizontal" | "vertical";
  showDescriptions?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  variant = "default",
  orientation = "horizontal",
  showDescriptions = true,
  className,
}) => {
  const isHorizontal = orientation === "horizontal";

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  const getStepClasses = (status: string) => {
    const baseClasses = [
      "flex items-center justify-center rounded-full transition-all duration-300",
      "font-semibold text-sm",
    ];

    const statusClasses = {
      completed: [
        "bg-success-500 text-white shadow-soft",
        variant === "playful" && "animate-bounce-gentle",
      ],
      current: [
        "bg-primary-500 text-white shadow-medium",
        variant === "playful" && "animate-pulse-soft shadow-glow",
        "ring-4 ring-primary-200 dark:ring-primary-800",
      ],
      upcoming: [
        "bg-neutral-200 text-neutral-600 border-2 border-neutral-300",
        "dark:bg-neutral-700 dark:text-neutral-400 dark:border-neutral-600",
      ],
    };

    const sizeClasses = variant === "minimal" ? "w-8 h-8" : "w-10 h-10";

    return cn(baseClasses, statusClasses[status], sizeClasses);
  };

  const getConnectorClasses = (fromStatus: string, toStatus: string) => {
    const baseClasses = [
      "transition-all duration-500",
      isHorizontal ? "h-0.5 flex-1" : "w-0.5 h-8",
    ];

    const isCompleted =
      fromStatus === "completed" &&
      (toStatus === "completed" || toStatus === "current");

    return cn(
      baseClasses,
      isCompleted ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-600"
    );
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className={getStepClasses(status)}>
                {status === "completed" ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              {!isLast && (
                <div
                  className={getConnectorClasses(
                    status,
                    getStepStatus(steps[index + 1].id)
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "items-center justify-between" : "flex-col space-y-4",
        className
      )}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-1" : "w-full",
              !isLast && isHorizontal && "pr-4"
            )}
          >
            <div className="flex items-center">
              {/* Step Circle */}
              <div className={getStepClasses(status)}>
                {status === "completed" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>

              {/* Step Content */}
              <div
                className={cn(
                  "ml-4",
                  isHorizontal ? "text-center" : "text-left"
                )}
              >
                <div
                  className={cn(
                    "font-medium transition-colors duration-200",
                    status === "current"
                      ? "text-primary-600 dark:text-primary-400"
                      : status === "completed"
                      ? "text-success-600 dark:text-success-400"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {step.title}
                </div>
                {showDescriptions && step.description && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && isHorizontal && (
              <div className="flex-1 mx-4">
                <div
                  className={getConnectorClasses(
                    status,
                    getStepStatus(steps[index + 1].id)
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "playful";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
  animated = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    default: "bg-primary-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    playful: "bg-gradient-to-r from-primary-500 to-secondary-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label || "Progress"}
          </span>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant],
            animated && "animate-pulse-soft"
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export { ProgressIndicator, ProgressBar };
