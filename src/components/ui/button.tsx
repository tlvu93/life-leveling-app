"use client";

import React from "react";
import { clsx } from "clsx";
import { TOUCH_TARGETS } from "@/lib/accessibility";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  playful?: boolean;
  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      playful = false,
      children,
      disabled,
      ariaLabel,
      ariaDescribedBy,
      ariaPressed,
      ariaExpanded,
      ariaControls,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "inline-flex items-center justify-center gap-2",
      "font-medium rounded-xl transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "active:scale-95",
      // Ensure minimum touch target size (44x44px)
      `min-h-[${TOUCH_TARGETS.MINIMUM}px]`,
      "min-w-[44px]",
      fullWidth && "w-full",
      playful && "transform hover:scale-105 active:scale-95",
    ];

    const variantClasses = {
      primary: [
        "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg",
        "hover:from-blue-600 hover:to-purple-700 hover:shadow-xl",
        "focus-visible:ring-blue-500",
        playful && "hover:shadow-glow",
      ],
      secondary: [
        "bg-secondary text-secondary-foreground shadow-md",
        "hover:bg-secondary/80 hover:shadow-lg",
        "focus-visible:ring-secondary",
        playful && "hover:shadow-glow",
      ],
      success: [
        "bg-green-500 text-white shadow-md",
        "hover:bg-green-600 hover:shadow-lg",
        "focus-visible:ring-green-500",
        playful && "hover:shadow-glow-success",
      ],
      warning: [
        "bg-orange-500 text-white shadow-md",
        "hover:bg-orange-600 hover:shadow-lg",
        "focus-visible:ring-orange-500",
        playful && "hover:shadow-glow-warning",
      ],
      error: [
        "bg-red-500 text-white shadow-md",
        "hover:bg-red-600 hover:shadow-lg",
        "focus-visible:ring-red-500",
      ],
      ghost: [
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-ring",
      ],
      outline: [
        "border border-input bg-background text-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-ring",
      ],
    };

    const sizeClasses = {
      sm: `px-3 py-1.5 text-sm min-h-[${TOUCH_TARGETS.MINIMUM}px]`,
      md: `px-4 py-2 text-base min-h-[${TOUCH_TARGETS.MINIMUM}px]`,
      lg: `px-6 py-3 text-lg min-h-[${TOUCH_TARGETS.RECOMMENDED}px]`,
      xl: `px-8 py-4 text-xl min-h-[56px]`,
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        {...props}
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
