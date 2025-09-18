"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityTheme {
  highContrast: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
  focusEnhanced: boolean;
}

interface AccessibilityThemeContextType {
  theme: AccessibilityTheme;
  updateTheme: (updates: Partial<AccessibilityTheme>) => void;
  resetTheme: () => void;
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleReducedMotion: () => void;
  toggleColorBlindFriendly: () => void;
  toggleFocusEnhanced: () => void;
}

const AccessibilityThemeContext = createContext<
  AccessibilityThemeContextType | undefined
>(undefined);

const defaultTheme: AccessibilityTheme = {
  highContrast: false,
  fontSize: "medium",
  reducedMotion: false,
  colorBlindFriendly: false,
  focusEnhanced: false,
};

const fontSizeMap = {
  small: "14px",
  medium: "16px",
  large: "18px",
  "extra-large": "20px",
};

const fontSizeOrder: Array<AccessibilityTheme["fontSize"]> = [
  "small",
  "medium",
  "large",
  "extra-large",
];

export const AccessibilityThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [theme, setTheme] = useState<AccessibilityTheme>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("accessibility-theme");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn("Failed to parse saved accessibility theme:", error);
      }
    }

    // Check system preferences
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (highContrastQuery.matches) {
      setTheme((prev) => ({ ...prev, highContrast: true }));
    }
    if (reducedMotionQuery.matches) {
      setTheme((prev) => ({ ...prev, reducedMotion: true }));
    }

    // Listen for system preference changes
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setTheme((prev) => ({ ...prev, highContrast: e.matches }));
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setTheme((prev) => ({ ...prev, reducedMotion: e.matches }));
    };

    highContrastQuery.addEventListener("change", handleHighContrastChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener("change", handleHighContrastChange);
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange
      );
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply font size
    root.style.fontSize = fontSizeMap[theme.fontSize];

    // Apply high contrast
    if (theme.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply reduced motion
    if (theme.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Apply color blind friendly mode
    if (theme.colorBlindFriendly) {
      root.classList.add("color-blind-friendly");
    } else {
      root.classList.remove("color-blind-friendly");
    }

    // Apply enhanced focus
    if (theme.focusEnhanced) {
      root.classList.add("focus-enhanced");
    } else {
      root.classList.remove("focus-enhanced");
    }

    // Save to localStorage
    localStorage.setItem("accessibility-theme", JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (updates: Partial<AccessibilityTheme>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  const toggleHighContrast = () => {
    setTheme((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const increaseFontSize = () => {
    setTheme((prev) => {
      const currentIndex = fontSizeOrder.indexOf(prev.fontSize);
      const nextIndex = Math.min(currentIndex + 1, fontSizeOrder.length - 1);
      return { ...prev, fontSize: fontSizeOrder[nextIndex] };
    });
  };

  const decreaseFontSize = () => {
    setTheme((prev) => {
      const currentIndex = fontSizeOrder.indexOf(prev.fontSize);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, fontSize: fontSizeOrder[prevIndex] };
    });
  };

  const toggleReducedMotion = () => {
    setTheme((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleColorBlindFriendly = () => {
    setTheme((prev) => ({
      ...prev,
      colorBlindFriendly: !prev.colorBlindFriendly,
    }));
  };

  const toggleFocusEnhanced = () => {
    setTheme((prev) => ({ ...prev, focusEnhanced: !prev.focusEnhanced }));
  };

  const value: AccessibilityThemeContextType = {
    theme,
    updateTheme,
    resetTheme,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleReducedMotion,
    toggleColorBlindFriendly,
    toggleFocusEnhanced,
  };

  return (
    <AccessibilityThemeContext.Provider value={value}>
      {children}
    </AccessibilityThemeContext.Provider>
  );
};

export const useAccessibilityTheme = () => {
  const context = useContext(AccessibilityThemeContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibilityTheme must be used within an AccessibilityThemeProvider"
    );
  }
  return context;
};

// Quick access toolbar component
export const AccessibilityQuickActions: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const {
    theme,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleReducedMotion,
    toggleColorBlindFriendly,
    toggleFocusEnhanced,
  } = useAccessibilityTheme();

  return (
    <div
      className={`accessibility-quick-actions flex flex-wrap gap-2 ${className}`}
      role="toolbar"
      aria-label="Accessibility quick actions"
    >
      <button
        onClick={toggleHighContrast}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          theme.highContrast
            ? "bg-neutral-900 text-white border-neutral-700"
            : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50"
        }`}
        aria-pressed={theme.highContrast}
        title="Toggle high contrast mode"
      >
        <span className="sr-only">High contrast mode</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>

      <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
        <button
          onClick={decreaseFontSize}
          className="px-3 py-2 text-sm bg-white hover:bg-neutral-50 border-r border-neutral-300"
          title="Decrease font size"
          disabled={theme.fontSize === "small"}
        >
          <span className="sr-only">Decrease font size</span>
          <span aria-hidden="true">A-</span>
        </button>
        <button
          onClick={increaseFontSize}
          className="px-3 py-2 text-sm bg-white hover:bg-neutral-50"
          title="Increase font size"
          disabled={theme.fontSize === "extra-large"}
        >
          <span className="sr-only">Increase font size</span>
          <span aria-hidden="true">A+</span>
        </button>
      </div>

      <button
        onClick={toggleReducedMotion}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          theme.reducedMotion
            ? "bg-primary-100 text-primary-900 border-primary-300"
            : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50"
        }`}
        aria-pressed={theme.reducedMotion}
        title="Toggle reduced motion"
      >
        <span className="sr-only">Reduced motion</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
          />
        </svg>
      </button>

      <button
        onClick={toggleColorBlindFriendly}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          theme.colorBlindFriendly
            ? "bg-success-100 text-success-900 border-success-300"
            : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50"
        }`}
        aria-pressed={theme.colorBlindFriendly}
        title="Toggle color blind friendly mode"
      >
        <span className="sr-only">Color blind friendly mode</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>

      <button
        onClick={toggleFocusEnhanced}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          theme.focusEnhanced
            ? "bg-warning-100 text-warning-900 border-warning-300"
            : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50"
        }`}
        aria-pressed={theme.focusEnhanced}
        title="Toggle enhanced focus indicators"
      >
        <span className="sr-only">Enhanced focus indicators</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </button>
    </div>
  );
};

export default AccessibilityThemeProvider;
