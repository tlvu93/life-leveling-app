"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui-utils";
import { TOUCH_TARGETS } from "@/lib/accessibility";

// Large touch target button wrapper
interface LargeTouchTargetProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  minSize?: number;
}

export const LargeTouchTarget: React.FC<LargeTouchTargetProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
  ariaLabel,
  minSize = TOUCH_TARGETS.RECOMMENDED,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "large-touch-target flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200 ease-in-out",
        "hover:scale-105 active:scale-95",
        className
      )}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
        padding: "12px",
      }}
    >
      {children}
    </button>
  );
};

// Drag and drop with keyboard alternatives
interface AccessibleDragDropProps {
  items: Array<{ id: string; content: React.ReactNode; [key: string]: any }>;
  onReorder: (newOrder: string[]) => void;
  className?: string;
  itemClassName?: string;
}

export const AccessibleDragDrop: React.FC<AccessibleDragDropProps> = ({
  items,
  onReorder,
  className = "",
  itemClassName = "",
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [keyboardMode, setKeyboardMode] = useState(false);

  const handleKeyDown = (
    event: React.KeyboardEvent,
    itemId: string,
    index: number
  ) => {
    setKeyboardMode(true);

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        if (index > 0) {
          const newOrder = [...items.map((item) => item.id)];
          [newOrder[index], newOrder[index - 1]] = [
            newOrder[index - 1],
            newOrder[index],
          ];
          onReorder(newOrder);
          setFocusedIndex(index - 1);
        }
        break;

      case "ArrowDown":
        event.preventDefault();
        if (index < items.length - 1) {
          const newOrder = [...items.map((item) => item.id)];
          [newOrder[index], newOrder[index + 1]] = [
            newOrder[index + 1],
            newOrder[index],
          ];
          onReorder(newOrder);
          setFocusedIndex(index + 1);
        }
        break;

      case "Home":
        event.preventDefault();
        if (index > 0) {
          const newOrder = [...items.map((item) => item.id)];
          const [movedItem] = newOrder.splice(index, 1);
          newOrder.unshift(movedItem);
          onReorder(newOrder);
          setFocusedIndex(0);
        }
        break;

      case "End":
        event.preventDefault();
        if (index < items.length - 1) {
          const newOrder = [...items.map((item) => item.id)];
          const [movedItem] = newOrder.splice(index, 1);
          newOrder.push(movedItem);
          onReorder(newOrder);
          setFocusedIndex(items.length - 1);
        }
        break;
    }
  };

  return (
    <div className={cn("accessible-drag-drop", className)}>
      <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        <p>Use arrow keys to reorder items, Home/End to move to start/end.</p>
      </div>

      <div className="space-y-2" role="listbox" aria-label="Reorderable list">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "accessible-drag-item p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              "cursor-move hover:bg-neutral-50 dark:hover:bg-neutral-800",
              focusedIndex === index && "ring-2 ring-primary-500",
              itemClassName
            )}
            tabIndex={0}
            role="option"
            aria-selected={focusedIndex === index}
            onKeyDown={(e) => handleKeyDown(e, item.id, index)}
            onFocus={() => setFocusedIndex(index)}
            onMouseDown={() => setKeyboardMode(false)}
            draggable={!keyboardMode}
            onDragStart={() => setDraggedItem(item.id)}
            onDragEnd={() => setDraggedItem(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedItem && draggedItem !== item.id) {
                const draggedIndex = items.findIndex(
                  (i) => i.id === draggedItem
                );
                const newOrder = [...items.map((i) => i.id)];
                const [movedItem] = newOrder.splice(draggedIndex, 1);
                newOrder.splice(index, 0, movedItem);
                onReorder(newOrder);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">{item.content}</div>
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-xs text-neutral-500">
                  {index + 1} of {items.length}
                </span>
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Gesture alternative component
interface GestureAlternativeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  className?: string;
  showKeyboardAlternatives?: boolean;
}

export const GestureAlternative: React.FC<GestureAlternativeProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  className = "",
  showKeyboardAlternatives = true,
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null
  );

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    } else if (isUpSwipe && onSwipeUp) {
      onSwipeUp();
    } else if (isDownSwipe && onSwipeDown) {
      onSwipeDown();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        if (onSwipeLeft) {
          e.preventDefault();
          onSwipeLeft();
        }
        break;
      case "ArrowRight":
        if (onSwipeRight) {
          e.preventDefault();
          onSwipeRight();
        }
        break;
      case "ArrowUp":
        if (onSwipeUp) {
          e.preventDefault();
          onSwipeUp();
        }
        break;
      case "ArrowDown":
        if (onSwipeDown) {
          e.preventDefault();
          onSwipeDown();
        }
        break;
    }
  };

  return (
    <div
      className={cn("gesture-alternative", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}

      {showKeyboardAlternatives && (
        <div className="keyboard-alternatives mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Keyboard Alternatives</h4>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            {onSwipeLeft && (
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  ←
                </kbd>{" "}
                Same as swipe left
              </div>
            )}
            {onSwipeRight && (
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  →
                </kbd>{" "}
                Same as swipe right
              </div>
            )}
            {onSwipeUp && (
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  ↑
                </kbd>{" "}
                Same as swipe up
              </div>
            )}
            {onSwipeDown && (
              <div>
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">
                  ↓
                </kbd>{" "}
                Same as swipe down
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sticky action buttons for easy access
interface StickyActionsProps {
  actions: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "success" | "warning" | "error";
  }>;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  className?: string;
}

export const StickyActions: React.FC<StickyActionsProps> = ({
  actions,
  position = "bottom-right",
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "sticky-actions fixed z-50",
        positionClasses[position],
        className
      )}
    >
      {actions.length === 1 ? (
        <LargeTouchTarget
          onClick={actions[0].onClick}
          ariaLabel={actions[0].label}
          className="bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700"
        >
          {actions[0].icon || actions[0].label}
        </LargeTouchTarget>
      ) : (
        <div className="relative">
          {isExpanded && (
            <div className="absolute bottom-16 right-0 space-y-3">
              {actions.map((action) => (
                <LargeTouchTarget
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    setIsExpanded(false);
                  }}
                  ariaLabel={action.label}
                  className={cn(
                    "rounded-full shadow-lg text-white",
                    action.variant === "secondary" &&
                      "bg-secondary-600 hover:bg-secondary-700",
                    action.variant === "success" &&
                      "bg-success-600 hover:bg-success-700",
                    action.variant === "warning" &&
                      "bg-warning-600 hover:bg-warning-700",
                    action.variant === "error" &&
                      "bg-error-600 hover:bg-error-700",
                    (!action.variant || action.variant === "primary") &&
                      "bg-primary-600 hover:bg-primary-700"
                  )}
                >
                  {action.icon || action.label}
                </LargeTouchTarget>
              ))}
            </div>
          )}

          <LargeTouchTarget
            onClick={() => setIsExpanded(!isExpanded)}
            ariaLabel={isExpanded ? "Close actions menu" : "Open actions menu"}
            ariaExpanded={isExpanded}
            className="bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700"
          >
            <svg
              className={cn(
                "w-6 h-6 transition-transform",
                isExpanded && "rotate-45"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </LargeTouchTarget>
        </div>
      )}
    </div>
  );
};

// Dwell click component for users with limited motor control
interface DwellClickProps {
  children: React.ReactNode;
  onClick: () => void;
  dwellTime?: number;
  className?: string;
  showProgress?: boolean;
}

export const DwellClick: React.FC<DwellClickProps> = ({
  children,
  onClick,
  dwellTime = 1000,
  className = "",
  showProgress = true,
}) => {
  const [isDwelling, setIsDwelling] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startDwell = () => {
    setIsDwelling(true);
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (dwellTime / 50);
        return Math.min(newProgress, 100);
      });
    }, 50);

    timeoutRef.current = setTimeout(() => {
      onClick();
      resetDwell();
    }, dwellTime);
  };

  const resetDwell = () => {
    setIsDwelling(false);
    setProgress(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      resetDwell();
    };
  }, []);

  return (
    <div
      className={cn("dwell-click relative", className)}
      onMouseEnter={startDwell}
      onMouseLeave={resetDwell}
      onFocus={startDwell}
      onBlur={resetDwell}
      tabIndex={0}
      role="button"
      aria-label="Hover or focus to activate"
    >
      {children}

      {isDwelling && showProgress && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-300"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary-600"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  LargeTouchTarget,
  AccessibleDragDrop,
  GestureAlternative,
  StickyActions,
  DwellClick,
};
