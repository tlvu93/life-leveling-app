"use client";

import React, { useState } from "react";
import { useAccessibilityTheme } from "./AccessibilityThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui-utils";

interface AccessibilityControlPanelProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const AccessibilityControlPanel: React.FC<
  AccessibilityControlPanelProps
> = ({ className = "", isOpen: controlledIsOpen, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const {
    theme,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleReducedMotion,
    toggleColorBlindFriendly,
    toggleFocusEnhanced,
    resetTheme,
  } = useAccessibilityTheme();

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    if (onToggle) {
      onToggle(newIsOpen);
    } else {
      setInternalIsOpen(newIsOpen);
    }
  };

  const fontSizeLabels = {
    small: "Small (14px)",
    medium: "Medium (16px)",
    large: "Large (18px)",
    "extra-large": "Extra Large (20px)",
  };

  return (
    <div className={cn("accessibility-control-panel relative", className)}>
      {/* Toggle Button */}
      <Button
        onClick={handleToggle}
        ariaLabel={
          isOpen
            ? "Close accessibility controls"
            : "Open accessibility controls"
        }
        ariaExpanded={isOpen}
        ariaControls="accessibility-panel"
        variant="outline"
        size="md"
        className="flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Accessibility
      </Button>

      {/* Control Panel */}
      {isOpen && (
        <div
          id="accessibility-panel"
          className={cn(
            "absolute top-full right-0 mt-2 w-96 max-w-[90vw]",
            "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
            "rounded-lg shadow-lg p-6 z-50"
          )}
          role="dialog"
          aria-labelledby="accessibility-panel-title"
          aria-describedby="accessibility-panel-description"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="accessibility-panel-title"
              className="text-lg font-semibold"
            >
              Accessibility Controls
            </h2>
            <Button
              onClick={handleToggle}
              ariaLabel="Close accessibility controls"
              variant="ghost"
              size="sm"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          <p
            id="accessibility-panel-description"
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-6"
          >
            Customize your accessibility preferences to improve your experience
            with the application.
          </p>

          <div className="space-y-6">
            {/* High Contrast Mode */}
            <div className="accessibility-control">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    High Contrast Mode
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Increases contrast between text and background for better
                    visibility
                  </p>
                </div>
                <ToggleSwitch
                  id="high-contrast-toggle"
                  checked={theme.highContrast}
                  onChange={toggleHighContrast}
                  ariaLabel="Toggle high contrast mode"
                />
              </div>
            </div>

            {/* Font Size Control */}
            <div className="accessibility-control">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Font Size
              </h3>
              <div className="flex items-center justify-between">
                <Button
                  onClick={decreaseFontSize}
                  disabled={theme.fontSize === "small"}
                  variant="outline"
                  size="sm"
                  ariaLabel="Decrease font size"
                >
                  <span className="text-lg" aria-hidden="true">
                    A-
                  </span>
                </Button>

                <span className="text-sm text-neutral-700 dark:text-neutral-300 mx-4">
                  {fontSizeLabels[theme.fontSize]}
                </span>

                <Button
                  onClick={increaseFontSize}
                  disabled={theme.fontSize === "extra-large"}
                  variant="outline"
                  size="sm"
                  ariaLabel="Increase font size"
                >
                  <span className="text-lg" aria-hidden="true">
                    A+
                  </span>
                </Button>
              </div>

              {/* Font Size Slider Alternative */}
              <div className="mt-3">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={["small", "medium", "large", "extra-large"].indexOf(
                    theme.fontSize
                  )}
                  onChange={(e) => {
                    const sizes: Array<typeof theme.fontSize> = [
                      "small",
                      "medium",
                      "large",
                      "extra-large",
                    ];
                    const newSize = sizes[parseInt(e.target.value)];
                    if (newSize) {
                      const event = { target: { value: newSize } };
                      // Update theme with new font size
                      if (newSize === "small") decreaseFontSize();
                      else if (newSize === "large") increaseFontSize();
                      else if (newSize === "extra-large") {
                        increaseFontSize();
                        increaseFontSize();
                      }
                    }
                  }}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                  aria-label="Font size slider"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                  <span>Extra Large</span>
                </div>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="accessibility-control">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Reduce Motion
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Minimizes animations and transitions that may cause
                    discomfort
                  </p>
                </div>
                <ToggleSwitch
                  id="reduced-motion-toggle"
                  checked={theme.reducedMotion}
                  onChange={toggleReducedMotion}
                  ariaLabel="Toggle reduced motion"
                />
              </div>
            </div>

            {/* Color Blind Friendly */}
            <div className="accessibility-control">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Color Blind Friendly
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Uses patterns and icons in addition to colors to convey
                    information
                  </p>
                </div>
                <ToggleSwitch
                  id="color-blind-toggle"
                  checked={theme.colorBlindFriendly}
                  onChange={toggleColorBlindFriendly}
                  ariaLabel="Toggle color blind friendly mode"
                />
              </div>
            </div>

            {/* Enhanced Focus */}
            <div className="accessibility-control">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Enhanced Focus Indicators
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Makes focus indicators more prominent for keyboard
                    navigation
                  </p>
                </div>
                <ToggleSwitch
                  id="focus-enhanced-toggle"
                  checked={theme.focusEnhanced}
                  onChange={toggleFocusEnhanced}
                  ariaLabel="Toggle enhanced focus indicators"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              onClick={resetTheme}
              variant="outline"
              size="sm"
              fullWidth
              ariaLabel="Reset all accessibility settings to defaults"
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  Ctrl + =
                </kbd>{" "}
                Increase font size
              </div>
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  Ctrl + -
                </kbd>{" "}
                Decrease font size
              </div>
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  Ctrl + Shift + H
                </kbd>{" "}
                Toggle high contrast
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-primary-600" : "bg-neutral-200 dark:bg-neutral-700"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};

// Hook for keyboard shortcuts
export const useAccessibilityKeyboardShortcuts = () => {
  const { increaseFontSize, decreaseFontSize, toggleHighContrast } =
    useAccessibilityTheme();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            increaseFontSize();
            break;
          case "-":
            event.preventDefault();
            decreaseFontSize();
            break;
          case "H":
            if (event.shiftKey) {
              event.preventDefault();
              toggleHighContrast();
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [increaseFontSize, decreaseFontSize, toggleHighContrast]);
};

export default AccessibilityControlPanel;
