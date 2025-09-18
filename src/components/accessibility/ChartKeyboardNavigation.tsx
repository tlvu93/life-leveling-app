"use client";

import React, { useEffect, useRef, useState } from "react";
import { KEYBOARD_KEYS } from "@/lib/accessibility";

interface ChartKeyboardNavigationProps {
  children: React.ReactNode;
  dataPoints: Array<{
    id: string;
    label: string;
    value: number;
    [key: string]: any;
  }>;
  onDataPointFocus?: (dataPoint: any, index: number) => void;
  onDataPointSelect?: (dataPoint: any, index: number) => void;
  onEscape?: () => void;
  className?: string;
  ariaLabel?: string;
  instructions?: string;
}

export const ChartKeyboardNavigation: React.FC<
  ChartKeyboardNavigationProps
> = ({
  children,
  dataPoints,
  onDataPointFocus,
  onDataPointSelect,
  onEscape,
  className = "",
  ariaLabel = "Interactive chart",
  instructions = "Use arrow keys to navigate, Enter or Space to select, Escape to exit",
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isActive || dataPoints.length === 0) return;

    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_RIGHT:
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        setFocusedIndex((prev) => {
          const newIndex = prev < dataPoints.length - 1 ? prev + 1 : 0;
          onDataPointFocus?.(dataPoints[newIndex], newIndex);
          return newIndex;
        });
        break;

      case KEYBOARD_KEYS.ARROW_LEFT:
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        setFocusedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : dataPoints.length - 1;
          onDataPointFocus?.(dataPoints[newIndex], newIndex);
          return newIndex;
        });
        break;

      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        setFocusedIndex(0);
        onDataPointFocus?.(dataPoints[0], 0);
        break;

      case KEYBOARD_KEYS.END:
        event.preventDefault();
        const lastIndex = dataPoints.length - 1;
        setFocusedIndex(lastIndex);
        onDataPointFocus?.(dataPoints[lastIndex], lastIndex);
        break;

      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        if (focusedIndex >= 0) {
          onDataPointSelect?.(dataPoints[focusedIndex], focusedIndex);
        }
        break;

      case KEYBOARD_KEYS.ESCAPE:
        event.preventDefault();
        setIsActive(false);
        setFocusedIndex(-1);
        onEscape?.();
        break;

      // Number keys for direct navigation (1-9)
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        event.preventDefault();
        const numberIndex = parseInt(event.key) - 1;
        if (numberIndex < dataPoints.length) {
          setFocusedIndex(numberIndex);
          onDataPointFocus?.(dataPoints[numberIndex], numberIndex);
        }
        break;
    }
  };

  // Handle focus events
  const handleFocus = () => {
    setIsActive(true);
    if (focusedIndex === -1 && dataPoints.length > 0) {
      setFocusedIndex(0);
      onDataPointFocus?.(dataPoints[0], 0);
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    // Only deactivate if focus is moving outside the container
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setIsActive(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`chart-keyboard-navigation ${className}`}
      tabIndex={0}
      role="application"
      aria-label={ariaLabel}
      aria-describedby="chart-instructions"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div id="chart-instructions" className="sr-only">
        {instructions}
        {dataPoints.length > 0 &&
          ` Chart contains ${dataPoints.length} data points.`}
        {focusedIndex >= 0 &&
          ` Currently focused on ${dataPoints[focusedIndex]?.label}: ${dataPoints[focusedIndex]?.value}.`}
      </div>

      {React.cloneElement(children as React.ReactElement, {
        focusedIndex,
        isKeyboardActive: isActive,
      })}

      {/* Live region for announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isActive &&
          focusedIndex >= 0 &&
          `${dataPoints[focusedIndex]?.label}: ${dataPoints[focusedIndex]?.value}`}
      </div>
    </div>
  );
};

// Hook for managing chart keyboard navigation state
export const useChartKeyboardNavigation = (dataPoints: any[]) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const handleDataPointFocus = (dataPoint: any, index: number) => {
    setFocusedIndex(index);
  };

  const handleDataPointSelect = (dataPoint: any, index: number) => {
    // Override in parent component
  };

  const handleEscape = () => {
    setIsKeyboardActive(false);
    setFocusedIndex(-1);
  };

  const resetNavigation = () => {
    setFocusedIndex(-1);
    setIsKeyboardActive(false);
  };

  const focusDataPoint = (index: number) => {
    if (index >= 0 && index < dataPoints.length) {
      setFocusedIndex(index);
      setIsKeyboardActive(true);
    }
  };

  return {
    focusedIndex,
    isKeyboardActive,
    handleDataPointFocus,
    handleDataPointSelect,
    handleEscape,
    resetNavigation,
    focusDataPoint,
    setIsKeyboardActive,
  };
};

// Chart navigation instructions component
export const ChartNavigationInstructions: React.FC<{
  visible?: boolean;
  className?: string;
}> = ({ visible = false, className = "" }) => {
  if (!visible) return null;

  return (
    <div
      className={`chart-navigation-instructions p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border ${className}`}
    >
      <h3 className="font-semibold mb-2">Chart Navigation Instructions</h3>
      <ul className="text-sm space-y-1 text-neutral-700 dark:text-neutral-300">
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            ←→
          </kbd>{" "}
          or{" "}
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            ↑↓
          </kbd>{" "}
          Navigate between data points
        </li>
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            Enter
          </kbd>{" "}
          or{" "}
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            Space
          </kbd>{" "}
          Select current data point
        </li>
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            Home
          </kbd>{" "}
          Go to first data point
        </li>
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            End
          </kbd>{" "}
          Go to last data point
        </li>
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            1-9
          </kbd>{" "}
          Jump to specific data point
        </li>
        <li>
          <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
            Esc
          </kbd>{" "}
          Exit chart navigation
        </li>
      </ul>
    </div>
  );
};

export default ChartKeyboardNavigation;
