"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui-utils";
import {
  validateTouchTarget,
  validateContrast,
  validateHeadingHierarchy,
} from "@/lib/accessibility";

interface AccessibilityTest {
  id: string;
  name: string;
  description: string;
  category: "color" | "keyboard" | "screen-reader" | "motor" | "cognitive";
  status: "pass" | "fail" | "warning" | "not-tested";
  details?: string;
}

interface AccessibilityTesterProps {
  className?: string;
  autoRun?: boolean;
  showDetails?: boolean;
}

export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  className = "",
  autoRun = false,
  showDetails = true,
}) => {
  const [tests, setTests] = useState<AccessibilityTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const initialTests: AccessibilityTest[] = [
    // Color and Contrast Tests
    {
      id: "contrast-text",
      name: "Text Contrast Ratio",
      description: "Verify text meets WCAG AA contrast requirements (4.5:1)",
      category: "color",
      status: "not-tested",
    },
    {
      id: "contrast-interactive",
      name: "Interactive Element Contrast",
      description: "Verify buttons and links have sufficient contrast",
      category: "color",
      status: "not-tested",
    },
    {
      id: "color-only-info",
      name: "Color-Only Information",
      description: "Check that information is not conveyed by color alone",
      category: "color",
      status: "not-tested",
    },

    // Keyboard Navigation Tests
    {
      id: "keyboard-navigation",
      name: "Keyboard Navigation",
      description: "All interactive elements accessible via keyboard",
      category: "keyboard",
      status: "not-tested",
    },
    {
      id: "focus-indicators",
      name: "Focus Indicators",
      description: "Visible focus indicators on all interactive elements",
      category: "keyboard",
      status: "not-tested",
    },
    {
      id: "tab-order",
      name: "Tab Order",
      description: "Logical tab order through the interface",
      category: "keyboard",
      status: "not-tested",
    },

    // Screen Reader Tests
    {
      id: "heading-hierarchy",
      name: "Heading Hierarchy",
      description: "Proper heading structure (H1-H6) without skipping levels",
      category: "screen-reader",
      status: "not-tested",
    },
    {
      id: "aria-labels",
      name: "ARIA Labels",
      description: "Appropriate ARIA labels and descriptions",
      category: "screen-reader",
      status: "not-tested",
    },
    {
      id: "alt-text",
      name: "Alternative Text",
      description: "Images have appropriate alt text or are marked decorative",
      category: "screen-reader",
      status: "not-tested",
    },

    // Motor Accessibility Tests
    {
      id: "touch-targets",
      name: "Touch Target Size",
      description: "Interactive elements meet minimum 44x44px size",
      category: "motor",
      status: "not-tested",
    },
    {
      id: "gesture-alternatives",
      name: "Gesture Alternatives",
      description: "Alternative methods for gesture-based interactions",
      category: "motor",
      status: "not-tested",
    },

    // Cognitive Accessibility Tests
    {
      id: "clear-language",
      name: "Clear Language",
      description: "Simple, clear language and instructions",
      category: "cognitive",
      status: "not-tested",
    },
    {
      id: "consistent-navigation",
      name: "Consistent Navigation",
      description: "Navigation patterns are consistent throughout",
      category: "cognitive",
      status: "not-tested",
    },
    {
      id: "error-messages",
      name: "Clear Error Messages",
      description: "Error messages provide clear guidance",
      category: "cognitive",
      status: "not-tested",
    },
  ];

  useEffect(() => {
    setTests(initialTests);
    if (autoRun) {
      runAllTests();
    }
  }, [autoRun]);

  const runAllTests = async () => {
    setIsRunning(true);
    const updatedTests = [...tests];

    for (let i = 0; i < updatedTests.length; i++) {
      const test = updatedTests[i];
      const result = await runSingleTest(test);
      updatedTests[i] = { ...test, ...result };
      setTests([...updatedTests]);

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const runSingleTest = async (
    test: AccessibilityTest
  ): Promise<Partial<AccessibilityTest>> => {
    try {
      switch (test.id) {
        case "contrast-text":
          return testTextContrast();
        case "contrast-interactive":
          return testInteractiveContrast();
        case "color-only-info":
          return testColorOnlyInfo();
        case "keyboard-navigation":
          return testKeyboardNavigation();
        case "focus-indicators":
          return testFocusIndicators();
        case "tab-order":
          return testTabOrder();
        case "heading-hierarchy":
          return testHeadingHierarchy();
        case "aria-labels":
          return testAriaLabels();
        case "alt-text":
          return testAltText();
        case "touch-targets":
          return testTouchTargets();
        case "gesture-alternatives":
          return testGestureAlternatives();
        case "clear-language":
          return testClearLanguage();
        case "consistent-navigation":
          return testConsistentNavigation();
        case "error-messages":
          return testErrorMessages();
        default:
          return { status: "not-tested", details: "Test not implemented" };
      }
    } catch (error) {
      return {
        status: "fail",
        details: `Test failed with error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  };

  // Test implementations
  const testTextContrast = (): Partial<AccessibilityTest> => {
    const textElements = document.querySelectorAll(
      "p, span, div, h1, h2, h3, h4, h5, h6"
    );
    let failCount = 0;
    let totalCount = 0;

    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (
        color &&
        backgroundColor &&
        color !== "rgba(0, 0, 0, 0)" &&
        backgroundColor !== "rgba(0, 0, 0, 0)"
      ) {
        totalCount++;
        // Simplified contrast check - in production, use a proper contrast library
        if (!validateContrast(color, backgroundColor)) {
          failCount++;
        }
      }
    });

    if (failCount === 0) {
      return {
        status: "pass",
        details: `All ${totalCount} text elements have sufficient contrast`,
      };
    } else {
      return {
        status: "fail",
        details: `${failCount} of ${totalCount} text elements fail contrast requirements`,
      };
    }
  };

  const testInteractiveContrast = (): Partial<AccessibilityTest> => {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea"
    );
    let failCount = 0;

    interactiveElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (!validateContrast(color, backgroundColor)) {
        failCount++;
      }
    });

    return failCount === 0
      ? {
          status: "pass",
          details: "All interactive elements have sufficient contrast",
        }
      : {
          status: "fail",
          details: `${failCount} interactive elements fail contrast requirements`,
        };
  };

  const testColorOnlyInfo = (): Partial<AccessibilityTest> => {
    // Check for common patterns that rely only on color
    const colorOnlyPatterns = [
      "color: red",
      "color: green",
      "color: blue",
      "background-color: red",
      "background-color: green",
      "background-color: blue",
    ];

    // This is a simplified check - in practice, you'd need more sophisticated analysis
    return {
      status: "warning",
      details: "Manual review required for color-only information",
    };
  };

  const testKeyboardNavigation = (): Partial<AccessibilityTest> => {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea, [tabindex]"
    );
    let inaccessibleCount = 0;

    interactiveElements.forEach((element) => {
      const tabIndex = element.getAttribute("tabindex");
      if (tabIndex === "-1" && element.tagName !== "DIV") {
        inaccessibleCount++;
      }
    });

    return inaccessibleCount === 0
      ? {
          status: "pass",
          details: "All interactive elements are keyboard accessible",
        }
      : {
          status: "fail",
          details: `${inaccessibleCount} elements are not keyboard accessible`,
        };
  };

  const testFocusIndicators = (): Partial<AccessibilityTest> => {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea"
    );
    let missingFocusCount = 0;

    interactiveElements.forEach((element) => {
      const styles = window.getComputedStyle(element, ":focus-visible");
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;

      if (outline === "none" && boxShadow === "none") {
        missingFocusCount++;
      }
    });

    return missingFocusCount === 0
      ? {
          status: "pass",
          details: "All interactive elements have focus indicators",
        }
      : {
          status: "warning",
          details: `${missingFocusCount} elements may lack visible focus indicators`,
        };
  };

  const testTabOrder = (): Partial<AccessibilityTest> => {
    const tabbableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    );

    // Check if elements are in logical order (simplified check)
    let logicalOrder = true;
    for (let i = 1; i < tabbableElements.length; i++) {
      const current = tabbableElements[i].getBoundingClientRect();
      const previous = tabbableElements[i - 1].getBoundingClientRect();

      // Very basic check - elements should generally flow top to bottom, left to right
      if (
        current.top < previous.top - 10 &&
        current.left < previous.left - 10
      ) {
        logicalOrder = false;
        break;
      }
    }

    return logicalOrder
      ? { status: "pass", details: "Tab order appears logical" }
      : {
          status: "warning",
          details: "Tab order may not be logical - manual review recommended",
        };
  };

  const testHeadingHierarchy = (): Partial<AccessibilityTest> => {
    const isValid = validateHeadingHierarchy(document.body);
    return isValid
      ? { status: "pass", details: "Heading hierarchy is correct" }
      : {
          status: "fail",
          details: "Heading hierarchy has issues - check console for details",
        };
  };

  const testAriaLabels = (): Partial<AccessibilityTest> => {
    const elementsNeedingLabels = document.querySelectorAll(
      "button, input, select, textarea"
    );
    let missingLabelsCount = 0;

    elementsNeedingLabels.forEach((element) => {
      const hasLabel =
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby") ||
        element.querySelector("label") ||
        (element as HTMLElement).textContent?.trim();

      if (!hasLabel) {
        missingLabelsCount++;
      }
    });

    return missingLabelsCount === 0
      ? {
          status: "pass",
          details: "All interactive elements have appropriate labels",
        }
      : {
          status: "fail",
          details: `${missingLabelsCount} elements are missing labels`,
        };
  };

  const testAltText = (): Partial<AccessibilityTest> => {
    const images = document.querySelectorAll("img");
    let missingAltCount = 0;

    images.forEach((img) => {
      const alt = img.getAttribute("alt");
      const ariaHidden = img.getAttribute("aria-hidden");

      if (alt === null && ariaHidden !== "true") {
        missingAltCount++;
      }
    });

    return missingAltCount === 0
      ? { status: "pass", details: "All images have appropriate alt text" }
      : {
          status: "fail",
          details: `${missingAltCount} images are missing alt text`,
        };
  };

  const testTouchTargets = (): Partial<AccessibilityTest> => {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea"
    );
    let smallTargetsCount = 0;

    interactiveElements.forEach((element) => {
      if (!validateTouchTarget(element as HTMLElement)) {
        smallTargetsCount++;
      }
    });

    return smallTargetsCount === 0
      ? {
          status: "pass",
          details: "All touch targets meet minimum size requirements",
        }
      : {
          status: "fail",
          details: `${smallTargetsCount} touch targets are too small`,
        };
  };

  const testGestureAlternatives = (): Partial<AccessibilityTest> => {
    // This would require more sophisticated analysis of gesture-based interactions
    return {
      status: "warning",
      details: "Manual review required for gesture alternatives",
    };
  };

  const testClearLanguage = (): Partial<AccessibilityTest> => {
    // This would require natural language processing to assess readability
    return {
      status: "warning",
      details: "Manual review required for language clarity",
    };
  };

  const testConsistentNavigation = (): Partial<AccessibilityTest> => {
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    return navElements.length > 0
      ? {
          status: "pass",
          details: "Navigation elements found - manual review for consistency",
        }
      : { status: "warning", details: "No navigation elements found" };
  };

  const testErrorMessages = (): Partial<AccessibilityTest> => {
    const errorElements = document.querySelectorAll(
      '[role="alert"], .error, [aria-invalid="true"]'
    );
    return {
      status: "warning",
      details: `Found ${errorElements.length} error-related elements - manual review for clarity`,
    };
  };

  const filteredTests =
    selectedCategory === "all"
      ? tests
      : tests.filter((test) => test.category === selectedCategory);

  const getStatusIcon = (status: AccessibilityTest["status"]) => {
    switch (status) {
      case "pass":
        return <span className="text-success-600">✓</span>;
      case "fail":
        return <span className="text-error-600">✗</span>;
      case "warning":
        return <span className="text-warning-600">⚠</span>;
      default:
        return <span className="text-neutral-400">○</span>;
    }
  };

  const getStatusColor = (status: AccessibilityTest["status"]) => {
    switch (status) {
      case "pass":
        return "text-success-600 bg-success-50 border-success-200";
      case "fail":
        return "text-error-600 bg-error-50 border-error-200";
      case "warning":
        return "text-warning-600 bg-warning-50 border-warning-200";
      default:
        return "text-neutral-600 bg-neutral-50 border-neutral-200";
    }
  };

  const passCount = tests.filter((t) => t.status === "pass").length;
  const failCount = tests.filter((t) => t.status === "fail").length;
  const warningCount = tests.filter((t) => t.status === "warning").length;

  return (
    <div
      className={cn(
        "accessibility-tester p-6 bg-white dark:bg-neutral-800 rounded-lg border",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Accessibility Testing</h2>
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          variant="primary"
          size="md"
        >
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded">
          <div className="text-2xl font-bold">{tests.length}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Total Tests
          </div>
        </div>
        <div className="text-center p-3 bg-success-50 dark:bg-success-900/20 rounded">
          <div className="text-2xl font-bold text-success-600">{passCount}</div>
          <div className="text-sm text-success-600">Passed</div>
        </div>
        <div className="text-center p-3 bg-error-50 dark:bg-error-900/20 rounded">
          <div className="text-2xl font-bold text-error-600">{failCount}</div>
          <div className="text-sm text-error-600">Failed</div>
        </div>
        <div className="text-center p-3 bg-warning-50 dark:bg-warning-900/20 rounded">
          <div className="text-2xl font-bold text-warning-600">
            {warningCount}
          </div>
          <div className="text-sm text-warning-600">Warnings</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
        >
          <option value="all">All Categories</option>
          <option value="color">Color & Contrast</option>
          <option value="keyboard">Keyboard Navigation</option>
          <option value="screen-reader">Screen Reader</option>
          <option value="motor">Motor Accessibility</option>
          <option value="cognitive">Cognitive Accessibility</option>
        </select>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className={cn("p-4 border rounded-lg", getStatusColor(test.status))}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(test.status)}
                  <h3 className="font-medium">{test.name}</h3>
                  <span className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-600 rounded">
                    {test.category}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {test.description}
                </p>
                {showDetails && test.details && (
                  <p className="text-sm font-medium">{test.details}</p>
                )}
              </div>
              <Button
                onClick={() =>
                  runSingleTest(test).then((result) => {
                    setTests((prev) =>
                      prev.map((t) =>
                        t.id === test.id ? { ...t, ...result } : t
                      )
                    );
                  })
                }
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                Retest
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityTester;
