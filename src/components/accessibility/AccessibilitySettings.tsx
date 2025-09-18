"use client";

import React, { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui-utils";

interface AccessibilitySettingsProps {
  className?: string;
  onClose?: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className,
  onClose,
}) => {
  const { settings, updateSettings, announceToScreenReader } =
    useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    announceToScreenReader(`${key} setting changed to ${value}`, "polite");
  };

  const fontSizeOptions = [
    { value: "small", label: "Small (14px)" },
    { value: "medium", label: "Medium (16px)" },
    { value: "large", label: "Large (18px)" },
    { value: "extra-large", label: "Extra Large (20px)" },
  ];

  return (
    <div className={cn("accessibility-settings", className)}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        ariaLabel="Open accessibility settings"
        ariaExpanded={isOpen}
        ariaControls="accessibility-panel"
        variant="outline"
        size="md"
      >
        <svg
          className="w-5 h-5 mr-2"
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

      {isOpen && (
        <div
          id="accessibility-panel"
          className={cn(
            "absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-800",
            "border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg",
            "p-6 z-50"
          )}
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-describedby="accessibility-description"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="accessibility-title" className="text-lg font-semibold">
              Accessibility Settings
            </h2>
            <Button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              ariaLabel="Close accessibility settings"
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
            id="accessibility-description"
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-6"
          >
            Customize your accessibility preferences to improve your experience.
          </p>

          <div className="space-y-6">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="high-contrast-toggle"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  High Contrast Mode
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Increases contrast for better visibility
                </p>
              </div>
              <button
                id="high-contrast-toggle"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() =>
                  handleSettingChange("highContrast", !settings.highContrast)
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  settings.highContrast
                    ? "bg-primary-600"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.highContrast ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="reduced-motion-toggle"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Reduce Motion
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Minimizes animations and transitions
                </p>
              </div>
              <button
                id="reduced-motion-toggle"
                role="switch"
                aria-checked={settings.reducedMotion}
                onClick={() =>
                  handleSettingChange("reducedMotion", !settings.reducedMotion)
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  settings.reducedMotion
                    ? "bg-primary-600"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.reducedMotion ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Font Size Selection */}
            <div>
              <fieldset>
                <legend className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  Font Size
                </legend>
                <div className="space-y-2">
                  {fontSizeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="fontSize"
                        value={option.value}
                        checked={settings.fontSize === option.value}
                        onChange={() =>
                          handleSettingChange("fontSize", option.value)
                        }
                        className={cn(
                          "h-4 w-4 text-primary-600 border-neutral-300 dark:border-neutral-600",
                          "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        )}
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Screen Reader Optimizations */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="screen-reader-toggle"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Screen Reader Optimizations
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Enhanced support for screen readers
                </p>
              </div>
              <button
                id="screen-reader-toggle"
                role="switch"
                aria-checked={settings.screenReaderOptimized}
                onClick={() =>
                  handleSettingChange(
                    "screenReaderOptimized",
                    !settings.screenReaderOptimized
                  )
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  settings.screenReaderOptimized
                    ? "bg-primary-600"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.screenReaderOptimized
                      ? "translate-x-6"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              onClick={() => {
                updateSettings({
                  highContrast: false,
                  reducedMotion: false,
                  fontSize: "medium",
                  screenReaderOptimized: false,
                });
                announceToScreenReader(
                  "Accessibility settings reset to defaults",
                  "polite"
                );
              }}
              variant="outline"
              size="sm"
              fullWidth
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilitySettings;
