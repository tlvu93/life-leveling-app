"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  handleError,
  getErrorHandlingStrategy,
  LifeLevelingError,
  AppError,
} from "@/lib/error-handler";

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  ageGroup?: "child" | "teen" | "adult";
  onError?: (error: AppError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { addToast } = useToast();
  const { showToast = true, ageGroup = "teen", onError } = options;

  const handleErrorWithFeedback = useCallback(
    (error: Error | LifeLevelingError, context?: Record<string, any>) => {
      const appError = handleError(error, context);
      const strategy = getErrorHandlingStrategy(appError.severity);

      // Show toast notification if enabled
      if (showToast && strategy.showToast) {
        const toastVariant = {
          low: "warning" as const,
          medium: "error" as const,
          high: "error" as const,
          critical: "error" as const,
        }[appError.severity];

        addToast({
          variant: toastVariant,
          title: getErrorTitle(appError.severity),
          message: appError.userMessage,
          duration: getToastDuration(appError.severity),
          dismissible: true,
        });
      }

      // Call custom error handler if provided
      if (onError) {
        onError(appError);
      }

      return appError;
    },
    [addToast, showToast, ageGroup, onError]
  );

  return {
    handleError: handleErrorWithFeedback,
  };
}

function getErrorTitle(severity: AppError["severity"]): string {
  switch (severity) {
    case "low":
      return "Heads up!";
    case "medium":
      return "Oops!";
    case "high":
      return "Something went wrong";
    case "critical":
      return "Critical Error";
    default:
      return "Error";
  }
}

function getToastDuration(severity: AppError["severity"]): number {
  switch (severity) {
    case "low":
      return 3000; // 3 seconds
    case "medium":
      return 5000; // 5 seconds
    case "high":
      return 8000; // 8 seconds
    case "critical":
      return 0; // Don't auto-dismiss
    default:
      return 5000;
  }
}
