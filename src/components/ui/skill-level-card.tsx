"use client";

import React from "react";
import { clsx } from "clsx";

export interface SkillLevelCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "novice" | "intermediate" | "advanced" | "expert";
}

const VARIANT_STYLES = {
  novice: {
    base: "bg-green-50/50 dark:bg-green-950/10 border-green-200/50 dark:border-green-800/30",
    selected:
      "bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-600 shadow-md transform scale-105",
    hover:
      "hover:bg-green-100/50 dark:hover:bg-green-900/10 hover:border-green-300 dark:hover:border-green-700",
    text: "text-green-600 dark:text-green-400",
  },
  intermediate: {
    base: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/30",
    selected:
      "bg-blue-100 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-md transform scale-105",
    hover:
      "hover:bg-blue-100/50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700",
    text: "text-blue-600 dark:text-blue-400",
  },
  advanced: {
    base: "bg-purple-50/50 dark:bg-purple-950/10 border-purple-200/50 dark:border-purple-800/30",
    selected:
      "bg-purple-100 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-md transform scale-105",
    hover:
      "hover:bg-purple-100/50 dark:hover:bg-purple-900/10 hover:border-purple-300 dark:hover:border-purple-700",
    text: "text-purple-600 dark:text-purple-400",
  },
  expert: {
    base: "bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/50 dark:border-orange-800/30",
    selected:
      "bg-orange-100 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600 shadow-md transform scale-105",
    hover:
      "hover:bg-orange-100/50 dark:hover:bg-orange-900/10 hover:border-orange-300 dark:hover:border-orange-700",
    text: "text-orange-600 dark:text-orange-400",
  },
};

export const SkillLevelCard = React.forwardRef<
  HTMLButtonElement,
  SkillLevelCardProps
>(
  (
    {
      title,
      description,
      icon,
      isSelected = false,
      onClick,
      disabled = false,
      className,
      variant = "novice",
      ...props
    },
    ref
  ) => {
    const styles = VARIANT_STYLES[variant];

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          // Base styles
          "p-4 rounded-lg border-2 transition-all duration-200 text-left w-full",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",

          // State-dependent styles
          isSelected
            ? styles.selected
            : [styles.base, !disabled && styles.hover],

          // Cursor
          !disabled && "cursor-pointer",

          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{icon}</span>
          <span className={clsx("font-medium", styles.text)}>{title}</span>
          {isSelected && (
            <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-primary-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <p className="text-sm text-foreground/80">{description}</p>
      </button>
    );
  }
);

SkillLevelCard.displayName = "SkillLevelCard";
