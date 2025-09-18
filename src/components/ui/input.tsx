"use client";

import React from "react";
import { clsx } from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "playful";
  fullWidth?: boolean;
  // Accessibility props
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaRequired?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "default",
      fullWidth = false,
      id,
      required,
      ariaDescribedBy,
      ariaInvalid,
      ariaRequired,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy =
      [ariaDescribedBy, errorId, helperId].filter(Boolean).join(" ") ||
      undefined;

    const baseClasses = [
      "flex h-12 rounded-xl border px-3 py-2 text-base",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-all duration-200",
      // Ensure minimum touch target height
      "min-h-[44px]",
      fullWidth && "w-full",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
    ];

    const variantClasses = {
      default: [
        "border-neutral-300 bg-white text-neutral-900",
        "focus-visible:ring-primary-500 focus-visible:border-primary-500",
        "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        error && "border-error-500 focus-visible:ring-error-500",
      ],
      playful: [
        "border-primary-200 bg-primary-50/50 text-neutral-900",
        "focus-visible:ring-primary-500 focus-visible:border-primary-400",
        "focus-visible:bg-white",
        "dark:border-primary-800 dark:bg-primary-950/50 dark:text-neutral-100",
        error && "border-error-500 bg-error-50/50 focus-visible:ring-error-500",
      ],
    };

    return (
      <div className={clsx("relative", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {label}
            {required && (
              <span className="text-error-600 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={clsx(baseClasses, variantClasses[variant], className)}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid ?? (error ? true : false)}
            aria-required={ariaRequired ?? required}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p
                id={errorId}
                className="text-sm text-error-600 dark:text-error-400 flex items-center gap-1"
                role="alert"
                aria-live="polite"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p
                id={helperId}
                className="text-sm text-neutral-600 dark:text-neutral-400"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
