"use client";

import React, { useEffect, useState } from "react";

interface HeadingInfo {
  level: number;
  text: string;
  element: HTMLElement;
  isValid: boolean;
  issues: string[];
}

interface HeadingHierarchyProps {
  container?: HTMLElement;
  onValidationChange?: (isValid: boolean, issues: string[]) => void;
  showDebugInfo?: boolean;
}

export const HeadingHierarchy: React.FC<HeadingHierarchyProps> = ({
  container,
  onValidationChange,
  showDebugInfo = false,
}) => {
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const validateHeadings = () => {
      const containerElement = container || document;
      const headingElements = Array.from(
        containerElement.querySelectorAll("h1, h2, h3, h4, h5, h6")
      ) as HTMLElement[];

      const headingInfos: HeadingInfo[] = [];
      const validationIssues: string[] = [];
      let previousLevel = 0;
      let hasH1 = false;

      headingElements.forEach((element, index) => {
        const level = parseInt(element.tagName.charAt(1));
        const text = element.textContent?.trim() || "";
        const elementIssues: string[] = [];

        // Check if this is an H1
        if (level === 1) {
          if (hasH1) {
            elementIssues.push(
              "Multiple H1 elements found - should only have one per page"
            );
            validationIssues.push(`Multiple H1 elements: "${text}"`);
          }
          hasH1 = true;
        }

        // Check for proper hierarchy (no skipping levels)
        if (level > previousLevel + 1) {
          elementIssues.push(
            `Heading level ${level} follows H${previousLevel} - skips levels`
          );
          validationIssues.push(
            `Heading hierarchy violation: H${level} "${text}" follows H${previousLevel}`
          );
        }

        // Check for empty headings
        if (!text) {
          elementIssues.push(
            "Heading is empty - should contain descriptive text"
          );
          validationIssues.push(`Empty heading: H${level}`);
        }

        // Check for very long headings
        if (text.length > 100) {
          elementIssues.push(
            "Heading is very long - consider shortening for better accessibility"
          );
          validationIssues.push(
            `Long heading: H${level} "${text.substring(0, 50)}..."`
          );
        }

        // Check for proper capitalization (basic check)
        if (text && text === text.toUpperCase() && text.length > 10) {
          elementIssues.push(
            "Heading is in all caps - may be difficult for screen readers"
          );
          validationIssues.push(`All caps heading: H${level} "${text}"`);
        }

        headingInfos.push({
          level,
          text,
          element,
          isValid: elementIssues.length === 0,
          issues: elementIssues,
        });

        previousLevel = level;
      });

      // Check if page has an H1
      if (headingElements.length > 0 && !hasH1) {
        validationIssues.push("Page should have exactly one H1 element");
      }

      setHeadings(headingInfos);
      setIssues(validationIssues);
      const overallValid = validationIssues.length === 0;
      setIsValid(overallValid);

      onValidationChange?.(overallValid, validationIssues);
    };

    // Initial validation
    validateHeadings();

    // Set up mutation observer to watch for heading changes
    const observer = new MutationObserver((mutations) => {
      const hasHeadingChanges = mutations.some((mutation) => {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);

          return [...addedNodes, ...removedNodes].some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return (
                element.matches("h1, h2, h3, h4, h5, h6") ||
                element.querySelector("h1, h2, h3, h4, h5, h6")
              );
            }
            return false;
          });
        }
        return false;
      });

      if (hasHeadingChanges) {
        validateHeadings();
      }
    });

    const containerElement = container || document.body;
    observer.observe(containerElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [container, onValidationChange]);

  if (!showDebugInfo) {
    return null;
  }

  return (
    <div className="heading-hierarchy-debug p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Heading Hierarchy Debug
        {isValid ? (
          <span className="ml-2 text-success-600">✓ Valid</span>
        ) : (
          <span className="ml-2 text-error-600">✗ Issues Found</span>
        )}
      </h3>

      {issues.length > 0 && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded">
          <h4 className="font-medium text-error-800 dark:text-error-200 mb-2">
            Validation Issues:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-error-700 dark:text-error-300">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium">Heading Structure:</h4>
        {headings.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            No headings found
          </p>
        ) : (
          <ul className="space-y-1">
            {headings.map((heading, index) => (
              <li
                key={index}
                className={`flex items-start space-x-2 text-sm ${
                  heading.isValid
                    ? "text-neutral-700 dark:text-neutral-300"
                    : "text-error-600 dark:text-error-400"
                }`}
              >
                <span
                  className="font-mono"
                  style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
                >
                  H{heading.level}:
                </span>
                <span className="flex-1">
                  {heading.text || "<empty>"}
                  {heading.issues.length > 0 && (
                    <ul className="mt-1 ml-4 list-disc list-inside text-xs">
                      {heading.issues.map((issue, issueIndex) => (
                        <li key={issueIndex}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Hook for heading hierarchy validation
export const useHeadingHierarchy = (container?: HTMLElement) => {
  const [isValid, setIsValid] = useState(true);
  const [issues, setIssues] = useState<string[]>([]);

  const handleValidationChange = (
    valid: boolean,
    validationIssues: string[]
  ) => {
    setIsValid(valid);
    setIssues(validationIssues);
  };

  return {
    isValid,
    issues,
    HeadingHierarchyValidator: () => (
      <HeadingHierarchy
        container={container}
        onValidationChange={handleValidationChange}
        showDebugInfo={false}
      />
    ),
  };
};

export default HeadingHierarchy;
