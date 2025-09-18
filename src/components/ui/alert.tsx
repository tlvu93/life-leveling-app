"use client";

import React from "react";
import { clsx } from "clsx";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      dismissible = false,
      onDismiss,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "relative rounded-xl border p-4",
      "transition-all duration-200",
    ];

    const variantClasses = {
      info: [
        "bg-primary-50 border-primary-200 text-primary-800",
        "dark:bg-primary-950 dark:border-primary-800 dark:text-primary-200",
      ],
      success: [
        "bg-success-50 border-success-200 text-success-800",
        "dark:bg-success-950 dark:border-success-800 dark:text-success-200",
      ],
      warning: [
        "bg-warning-50 border-warning-200 text-warning-800",
        "dark:bg-warning-950 dark:border-warning-800 dark:text-warning-200",
      ],
      error: [
        "bg-error-50 border-error-200 text-error-800",
        "dark:bg-error-950 dark:border-error-800 dark:text-error-200",
      ],
    };

    const defaultIcons = {
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    const displayIcon = icon || defaultIcons[variant];

    return (
      <div
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], className)}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          {displayIcon && (
            <div className="flex-shrink-0 mt-0.5">{displayIcon}</div>
          )}

          <div className="flex-1 min-w-0">
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <div className="text-sm">{children}</div>
          </div>

          {dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={clsx(
                "flex-shrink-0 rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5",
                "focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2",
                "transition-colors duration-150"
              )}
              aria-label="Dismiss alert"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
});

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
