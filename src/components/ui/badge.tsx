"use client";

import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "skill";
  size?: "sm" | "md" | "lg";
  skillLevel?: "novice" | "intermediate" | "advanced" | "expert";
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      skillLevel,
      dot = false,
      removable = false,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "inline-flex items-center gap-1.5 font-medium rounded-full",
      "transition-all duration-200",
      removable && "pr-1",
    ];

    const variantClasses = {
      default: [
        "bg-neutral-100 text-neutral-800 border border-neutral-200",
        "dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
      ],
      primary: [
        "bg-primary-100 text-primary-800 border border-primary-200",
        "dark:bg-primary-900 dark:text-primary-200 dark:border-primary-800",
      ],
      secondary: [
        "bg-secondary-100 text-secondary-800 border border-secondary-200",
        "dark:bg-secondary-900 dark:text-secondary-200 dark:border-secondary-800",
      ],
      success: [
        "bg-success-100 text-success-800 border border-success-200",
        "dark:bg-success-900 dark:text-success-200 dark:border-success-800",
      ],
      warning: [
        "bg-warning-100 text-warning-800 border border-warning-200",
        "dark:bg-warning-900 dark:text-warning-200 dark:border-warning-800",
      ],
      error: [
        "bg-error-100 text-error-800 border border-error-200",
        "dark:bg-error-900 dark:text-error-200 dark:border-error-800",
      ],
      skill: skillLevel
        ? [
            skillLevel === "novice" &&
              "bg-skill-novice text-warning-800 border border-skill-novice-border",
            skillLevel === "intermediate" &&
              "bg-skill-intermediate text-purple-800 border border-skill-intermediate-border",
            skillLevel === "advanced" &&
              "bg-skill-advanced text-success-800 border border-skill-advanced-border",
            skillLevel === "expert" &&
              "bg-skill-expert text-pink-800 border border-skill-expert-border",
          ]
        : "bg-neutral-100 text-neutral-800 border border-neutral-200",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };

    const dotClasses = {
      default: "bg-neutral-400",
      primary: "bg-primary-500",
      secondary: "bg-secondary-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      error: "bg-error-500",
      skill: skillLevel
        ? {
            novice: "bg-skill-novice-border",
            intermediate: "bg-skill-intermediate-border",
            advanced: "bg-skill-advanced-border",
            expert: "bg-skill-expert-border",
          }[skillLevel]
        : "bg-neutral-400",
    };

    return (
      <span
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={clsx(
              "w-2 h-2 rounded-full flex-shrink-0",
              dotClasses[variant]
            )}
          />
        )}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={clsx(
              "ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10",
              "focus:outline-none focus:ring-1 focus:ring-current",
              "transition-colors duration-150"
            )}
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
