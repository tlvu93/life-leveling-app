"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  focusVisible: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (
    message: string,
    priority?: "polite" | "assertive"
  ) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: string;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: "medium",
  focusVisible: true,
  screenReaderOptimized: false,
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Detect system preferences
  useEffect(() => {
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updateHighContrast = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
      if (e.matches) {
        setSettings((prev) => ({ ...prev, highContrast: true }));
      }
    };

    const updateReducedMotion = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      if (e.matches) {
        setSettings((prev) => ({ ...prev, reducedMotion: true }));
      }
    };

    // Set initial values
    setIsHighContrast(highContrastQuery.matches);
    setIsReducedMotion(reducedMotionQuery.matches);

    if (highContrastQuery.matches) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
    if (reducedMotionQuery.matches) {
      setSettings((prev) => ({ ...prev, reducedMotion: true }));
    }

    // Listen for changes
    highContrastQuery.addEventListener("change", updateHighContrast);
    reducedMotionQuery.addEventListener("change", updateReducedMotion);

    return () => {
      highContrastQuery.removeEventListener("change", updateHighContrast);
      reducedMotionQuery.removeEventListener("change", updateReducedMotion);
    };
  }, []);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("accessibility-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn("Failed to parse saved accessibility settings:", error);
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };
    root.style.fontSize = fontSizeMap[settings.fontSize];

    // Apply high contrast
    if (settings.highContrast || isHighContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply reduced motion
    if (settings.reducedMotion || isReducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Apply screen reader optimizations
    if (settings.screenReaderOptimized) {
      root.classList.add("screen-reader-optimized");
    } else {
      root.classList.remove("screen-reader-optimized");
    }
  }, [settings, isHighContrast, isReducedMotion]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("accessibility-settings", JSON.stringify(updated));
      return updated;
    });
  };

  const announceToScreenReader = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    isHighContrast: settings.highContrast || isHighContrast,
    isReducedMotion: settings.reducedMotion || isReducedMotion,
    fontSize: settings.fontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onEscape?: () => void,
  onEnter?: () => void,
  onArrowKeys?: (direction: "up" | "down" | "left" | "right") => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case "Enter":
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case "ArrowUp":
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys("up");
          }
          break;
        case "ArrowDown":
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys("down");
          }
          break;
        case "ArrowLeft":
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys("left");
          }
          break;
        case "ArrowRight":
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys("right");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, onEnter, onArrowKeys]);
};

// Hook for focus management
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const focusFirstFocusable = (container?: HTMLElement) => {
    const containerElement = container || document;
    const focusableElements = containerElement.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  };

  const focusLastFocusable = (container?: HTMLElement) => {
    const containerElement = container || document;
    const focusableElements = containerElement.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  };

  return {
    focusElement,
    focusFirstFocusable,
    focusLastFocusable,
  };
};
