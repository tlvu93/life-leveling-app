/**
 * Accessibility utilities and constants for WCAG 2.1 AA compliance
 */

// WCAG 2.1 AA contrast ratios
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  ENHANCED_NORMAL: 7.0,
  ENHANCED_LARGE: 4.5,
} as const;

// Minimum touch target sizes (44x44px as per WCAG)
export const TOUCH_TARGETS = {
  MINIMUM: 44,
  RECOMMENDED: 48,
} as const;

// Color contrast validation
export function validateContrast(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  // This is a simplified version - in production, you'd use a proper color contrast library
  const requiredRatio = isLargeText
    ? CONTRAST_RATIOS.LARGE_TEXT
    : CONTRAST_RATIOS.NORMAL_TEXT;

  // For now, return true - implement actual contrast calculation with a library like 'color-contrast'
  return true;
}

// ARIA live region priorities
export const ARIA_LIVE = {
  POLITE: "polite",
  ASSERTIVE: "assertive",
  OFF: "off",
} as const;

// Common ARIA roles
export const ARIA_ROLES = {
  BUTTON: "button",
  LINK: "link",
  HEADING: "heading",
  BANNER: "banner",
  NAVIGATION: "navigation",
  MAIN: "main",
  COMPLEMENTARY: "complementary",
  CONTENTINFO: "contentinfo",
  REGION: "region",
  ARTICLE: "article",
  SECTION: "section",
  ALERT: "alert",
  ALERTDIALOG: "alertdialog",
  DIALOG: "dialog",
  TOOLTIP: "tooltip",
  TAB: "tab",
  TABPANEL: "tabpanel",
  TABLIST: "tablist",
  MENU: "menu",
  MENUITEM: "menuitem",
  MENUBAR: "menubar",
  LISTBOX: "listbox",
  OPTION: "option",
  COMBOBOX: "combobox",
  TREE: "tree",
  TREEITEM: "treeitem",
  GRID: "grid",
  GRIDCELL: "gridcell",
  ROW: "row",
  ROWHEADER: "rowheader",
  COLUMNHEADER: "columnheader",
} as const;

// Keyboard navigation keys
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

// Focus management utilities
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(", ");

  return Array.from(container.querySelectorAll(focusableSelectors));
}

export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== KEYBOARD_KEYS.TAB) return;

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

  container.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

// Screen reader utilities
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Heading hierarchy validation
export function validateHeadingHierarchy(container: HTMLElement): boolean {
  const headings = Array.from(
    container.querySelectorAll("h1, h2, h3, h4, h5, h6")
  );
  let previousLevel = 0;

  for (const heading of headings) {
    const currentLevel = parseInt(heading.tagName.charAt(1));

    if (currentLevel > previousLevel + 1) {
      console.warn(
        `Heading hierarchy violation: ${heading.tagName} follows h${previousLevel}`
      );
      return false;
    }

    previousLevel = currentLevel;
  }

  return true;
}

// Generate unique IDs for accessibility
let idCounter = 0;
export function generateId(prefix = "a11y"): string {
  return `${prefix}-${++idCounter}`;
}

// Media query helpers for accessibility preferences
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersHighContrast(): boolean {
  return window.matchMedia("(prefers-contrast: high)").matches;
}

export function prefersDarkMode(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Touch target size validation
export function validateTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width >= TOUCH_TARGETS.MINIMUM && rect.height >= TOUCH_TARGETS.MINIMUM
  );
}

// Language and locale utilities
export function getDocumentLanguage(): string {
  return document.documentElement.lang || "en";
}

export function setDocumentLanguage(lang: string): void {
  document.documentElement.lang = lang;
}
