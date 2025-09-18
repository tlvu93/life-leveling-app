"use client";

import React from "react";
import { clsx } from "clsx";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "gradient" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      size = "md",
      showLabel = false,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const baseClasses = [
      "relative overflow-hidden rounded-full bg-secondary",
      "transition-all duration-300 ease-in-out",
    ];

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    const variantClasses = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
      success: "bg-green-500",
      warning: "bg-orange-500",
      error: "bg-red-500",
    };

    return (
      <div className="space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{label || "Progress"}</span>
            <span className="text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={clsx(baseClasses, sizeClasses[size], className)}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          {...props}
        >
          <div
            className={clsx(
              "h-full transition-all duration-500 ease-out rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
