"use client";

import React from "react";
import { clsx } from "clsx";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "neutral";
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "primary",
  className,
  label = "Loading...",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    primary: "border-primary-200 border-t-primary-600",
    secondary: "border-secondary-200 border-t-secondary-600",
    neutral: "border-neutral-200 border-t-neutral-600",
  };

  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
  fallback,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={clsx("flex items-center justify-center p-8", className)}>
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
};

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = ["animate-pulse bg-neutral-200 dark:bg-neutral-700"];

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && "w-3/4", // Last line is shorter
              !height && "h-4",
              className
            )}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        !height && variant === "text" && "h-4",
        !height && variant === "rectangular" && "h-20",
        !width && !height && variant === "circular" && "w-10 h-10",
        className
      )}
      style={style}
    />
  );
};

export { LoadingSpinner, LoadingState, Skeleton };
