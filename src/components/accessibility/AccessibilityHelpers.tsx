"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/ui-utils";

// Skip to main content link
export const SkipToMain: React.FC = () => (
  <a
    href="#main-content"
    className={cn(
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
      "bg-primary-600 text-white px-4 py-2 rounded-lg",
      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      "transition-all duration-200"
    )}
  >
    Skip to main content
  </a>
);

// Screen reader announcements
interface AnnouncementProps {
  message: string;
  priority?: "polite" | "assertive";
  clearAfter?: number;
}

export const ScreenReaderAnnouncement: React.FC<AnnouncementProps> = ({
  message,
  priority = "polite",
  clearAfter = 5000,
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div aria-live={priority} aria-atomic="true" className="sr-only">
      {currentMessage}
    </div>
  );
};

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  restoreFocus = true,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Keyboard navigation helper
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case "Enter":
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

// High contrast mode detector
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detector
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isPressed?: boolean;
  isExpanded?: boolean;
  controls?: string;
  describedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  isPressed,
  isExpanded,
  controls,
  describedBy,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "transition-all duration-200",
        className
      )}
      aria-pressed={isPressed}
      aria-expanded={isExpanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      {...props}
    >
      {children}
    </button>
  );
};

// Accessible form field with proper labeling
interface AccessibleFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  children,
  error,
  helperText,
  required,
  className,
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy =
    [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
      >
        {label}
        {required && (
          <span className="text-error-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? "true" : "false",
        "aria-required": required,
      })}

      {helperText && (
        <p
          id={helperId}
          className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-error-600 dark:text-error-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Loading state announcer
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}

export const LoadingAnnouncer: React.FC<LoadingAnnouncerProps> = ({
  isLoading,
  loadingMessage = "Loading...",
  completedMessage = "Loading completed",
}) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoading) {
      setMessage(loadingMessage);
    } else if (message === loadingMessage) {
      setMessage(completedMessage);
      // Clear the message after a short delay
      const timer = setTimeout(() => setMessage(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingMessage, completedMessage, message]);

  return (
    <ScreenReaderAnnouncement
      message={message}
      priority="polite"
      clearAfter={0} // We handle clearing manually
    />
  );
};

// Accessible tooltip
interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  id?: string;
  className?: string;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  children,
  content,
  id,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("relative inline-block", className)}>
      {React.cloneElement(children as React.ReactElement, {
        "aria-describedby": tooltipId,
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        onFocus: () => setIsVisible(true),
        onBlur: () => setIsVisible(false),
      })}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute z-50 px-2 py-1 text-sm text-white bg-neutral-900 rounded",
            "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            "pointer-events-none"
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900" />
        </div>
      )}
    </div>
  );
};
