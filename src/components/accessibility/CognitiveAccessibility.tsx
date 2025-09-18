"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui-utils";

// Simple language helper component
interface SimplifiedTextProps {
  children: React.ReactNode;
  simplifiedVersion?: string;
  showToggle?: boolean;
  className?: string;
}

export const SimplifiedText: React.FC<SimplifiedTextProps> = ({
  children,
  simplifiedVersion,
  showToggle = false,
  className = "",
}) => {
  const [useSimplified, setUseSimplified] = useState(false);

  if (!simplifiedVersion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {showToggle && (
        <Button
          onClick={() => setUseSimplified(!useSimplified)}
          variant="ghost"
          size="sm"
          className="mb-2 text-xs"
          ariaLabel={
            useSimplified ? "Show detailed text" : "Show simplified text"
          }
        >
          {useSimplified ? "Show More Details" : "Simplify Text"}
        </Button>
      )}
      {useSimplified ? simplifiedVersion : children}
    </div>
  );
};

// Progress indicator with clear steps
interface CognitiveProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showStepNumbers?: boolean;
  className?: string;
}

export const CognitiveProgress: React.FC<CognitiveProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  showStepNumbers = true,
  className = "",
}) => {
  return (
    <div
      className={cn("cognitive-progress", className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {showStepNumbers && `Step ${currentStep} of ${totalSteps}`}
          {stepLabels[currentStep - 1] && `: ${stepLabels[currentStep - 1]}`}
        </span>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>

      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
        <div
          className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {stepLabels.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={cn(
                "flex-1 text-center",
                index + 1 <= currentStep ? "text-primary-600 font-medium" : ""
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Breadcrumb navigation with clear hierarchy
interface CognitiveBreadcrumbsProps {
  items: Array<{ label: string; href?: string; current?: boolean }>;
  separator?: React.ReactNode;
  className?: string;
}

export const CognitiveBreadcrumbs: React.FC<CognitiveBreadcrumbsProps> = ({
  items,
  separator = "→",
  className = "",
}) => {
  return (
    <nav
      className={cn("cognitive-breadcrumbs", className)}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-neutral-400" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-primary-600 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "px-1",
                  item.current
                    ? "text-neutral-900 dark:text-neutral-100 font-medium"
                    : "text-neutral-600 dark:text-neutral-400"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Clear instructions component
interface InstructionsProps {
  title?: string;
  steps: string[];
  showNumbers?: boolean;
  collapsible?: boolean;
  className?: string;
}

export const Instructions: React.FC<InstructionsProps> = ({
  title = "Instructions",
  steps,
  showNumbers = true,
  collapsible = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  return (
    <div
      className={cn(
        "instructions bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4",
        className
      )}
    >
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={isExpanded}
          aria-controls="instructions-content"
        >
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            {title}
          </h3>
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              isExpanded ? "rotate-180" : ""
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      ) : (
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          {title}
        </h3>
      )}

      {isExpanded && (
        <div id="instructions-content">
          {showNumbers ? (
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// Animation control component
interface AnimationControlProps {
  children: React.ReactNode;
  pausable?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export const AnimationControl: React.FC<AnimationControlProps> = ({
  children,
  pausable = true,
  reducedMotion = false,
  className = "",
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [userPrefersReducedMotion, setUserPrefersReducedMotion] =
    useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setUserPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setUserPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const shouldPauseAnimations =
    isPaused || reducedMotion || userPrefersReducedMotion;

  return (
    <div
      className={cn(
        "animation-control",
        className,
        shouldPauseAnimations && "reduced-motion"
      )}
    >
      {pausable && !userPrefersReducedMotion && (
        <div className="animation-controls mb-2">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="outline"
            size="sm"
            ariaLabel={isPaused ? "Resume animations" : "Pause animations"}
          >
            {isPaused ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {isPaused ? "Resume" : "Pause"} Animations
          </Button>
        </div>
      )}
      {children}
    </div>
  );
};

// Help tooltip with clear explanations
interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = "top",
  children,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showTooltip = isVisible || isFocused;

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("help-tooltip relative inline-block", className)}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
        role="button"
        aria-describedby={showTooltip ? "tooltip-content" : undefined}
      >
        {children}
      </div>

      {showTooltip && (
        <div
          id="tooltip-content"
          role="tooltip"
          className={cn(
            "absolute z-50 max-w-xs p-3 text-sm bg-neutral-900 text-white rounded-lg shadow-lg",
            positionClasses[position]
          )}
        >
          {title && <div className="font-medium mb-1">{title}</div>}
          <div>{content}</div>

          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-neutral-900 transform rotate-45",
              position === "top" && "top-full left-1/2 -translate-x-1/2 -mt-1",
              position === "bottom" &&
                "bottom-full left-1/2 -translate-x-1/2 -mb-1",
              position === "left" && "left-full top-1/2 -translate-y-1/2 -ml-1",
              position === "right" &&
                "right-full top-1/2 -translate-y-1/2 -mr-1"
            )}
          />
        </div>
      )}
    </div>
  );
};

// Error message with clear guidance
interface ClearErrorMessageProps {
  error: string;
  suggestion?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const ClearErrorMessage: React.FC<ClearErrorMessageProps> = ({
  error,
  suggestion,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "clear-error-message bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
          {suggestion && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              <strong>What you can do:</strong> {suggestion}
            </p>
          )}
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default {
  SimplifiedText,
  CognitiveProgress,
  CognitiveBreadcrumbs,
  Instructions,
  AnimationControl,
  HelpTooltip,
  ClearErrorMessage,
};
