import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Animation utilities for consistent motion design
 */
export const animations = {
  // Entrance animations
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  slideDown: "animate-slide-down",
  scaleIn: "animate-scale-in",

  // Interactive animations
  bounceGentle: "animate-bounce-gentle",
  pulseSoft: "animate-pulse-soft",
  wiggle: "animate-wiggle",

  // Hover effects
  hoverScale:
    "hover:scale-105 active:scale-95 transition-transform duration-200",
  hoverGlow: "hover:shadow-glow transition-shadow duration-300",
  hoverLift:
    "hover:-translate-y-1 hover:shadow-medium transition-all duration-200",
} as const;

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/**
 * Color palette utilities for consistent theming
 */
export const colors = {
  primary: {
    light: "#60a5fa",
    main: "#3b82f6",
    dark: "#2563eb",
    contrast: "#ffffff",
  },
  secondary: {
    light: "#38bdf8",
    main: "#0ea5e9",
    dark: "#0284c7",
    contrast: "#ffffff",
  },
  success: {
    light: "#4ade80",
    main: "#22c55e",
    dark: "#16a34a",
    contrast: "#ffffff",
  },
  warning: {
    light: "#fbbf24",
    main: "#f59e0b",
    dark: "#d97706",
    contrast: "#ffffff",
  },
  error: {
    light: "#f87171",
    main: "#ef4444",
    dark: "#dc2626",
    contrast: "#ffffff",
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
} as const;

/**
 * Skill level color mapping
 */
export const skillColors = {
  novice: {
    bg: "#fef3c7",
    border: "#f59e0b",
    text: "#92400e",
  },
  intermediate: {
    bg: "#ddd6fe",
    border: "#8b5cf6",
    text: "#6b21a8",
  },
  advanced: {
    bg: "#dcfce7",
    border: "#10b981",
    text: "#065f46",
  },
  expert: {
    bg: "#fce7f3",
    border: "#ec4899",
    text: "#9d174d",
  },
} as const;

/**
 * Typography scale utilities
 */
export const typography = {
  display: {
    "4xl": "text-6xl font-bold font-display",
    "3xl": "text-5xl font-bold font-display",
    "2xl": "text-4xl font-bold font-display",
    xl: "text-3xl font-bold font-display",
    lg: "text-2xl font-semibold font-display",
  },
  heading: {
    "3xl": "text-3xl font-semibold",
    "2xl": "text-2xl font-semibold",
    xl: "text-xl font-semibold",
    lg: "text-lg font-semibold",
    md: "text-base font-semibold",
    sm: "text-sm font-semibold",
  },
  body: {
    xl: "text-xl",
    lg: "text-lg",
    md: "text-base",
    sm: "text-sm",
    xs: "text-xs",
  },
} as const;

/**
 * Spacing utilities for consistent layout
 */
export const spacing = {
  section: "py-16 px-4 sm:px-6 lg:px-8",
  container: "max-w-7xl mx-auto",
  card: "p-6",
  cardLarge: "p-8",
  cardSmall: "p-4",
} as const;

/**
 * Shadow utilities for depth and elevation
 */
export const shadows = {
  soft: "shadow-soft",
  medium: "shadow-medium",
  large: "shadow-large",
  glow: "shadow-glow",
  glowSuccess: "shadow-glow-success",
  glowWarning: "shadow-glow-warning",
} as const;

/**
 * Focus ring utilities for accessibility
 */
export const focusRing = {
  default:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
  success:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2",
  warning:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-500 focus-visible:ring-offset-2",
  error:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2",
} as const;

/**
 * Age-appropriate styling utilities
 */
export const ageAppropriate = {
  playful:
    "rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200",
  friendly:
    "rounded-xl shadow-soft hover:shadow-medium transition-shadow duration-200",
  encouraging: "bg-success-50 border border-success-200 text-success-800",
  gentle: "bg-warning-50 border border-warning-200 text-warning-800",
} as const;

/**
 * Utility function to get skill level styling
 */
export function getSkillLevelStyle(
  level: "novice" | "intermediate" | "advanced" | "expert"
) {
  const colors = skillColors[level];
  return {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    color: colors.text,
  };
}

/**
 * Utility function to format skill level names
 */
export function formatSkillLevel(level: number): string {
  const levels = ["Novice", "Intermediate", "Advanced", "Expert"];
  return levels[level - 1] || "Unknown";
}

/**
 * Utility function to get age-appropriate messaging
 */
export function getEncouragingMessage(
  context: "progress" | "goal" | "comparison" | "error"
): string {
  const messages = {
    progress: [
      "Great job! You're making awesome progress! 🌟",
      "Look at you go! Keep up the fantastic work! 🚀",
      "You're doing amazing! Every step counts! ✨",
      "Wonderful progress! You should be proud! 🎉",
    ],
    goal: [
      "What an exciting goal! You've got this! 💪",
      "That's a fantastic goal to work towards! 🎯",
      "Love this goal! Can't wait to see your progress! 🌈",
      "Such an inspiring goal! You're going to do great! ⭐",
    ],
    comparison: [
      "You're doing great compared to others your age! 🏆",
      "Your progress is really impressive! Keep it up! 📈",
      "You're right on track with your peers! Awesome! 👏",
      "Your dedication is showing in your results! 🌟",
    ],
    error: [
      "Oops! No worries, let's try that again! 😊",
      "That didn't work, but that's totally okay! Let's fix it! 🔧",
      "No problem! Everyone makes mistakes. Let's sort this out! 💫",
      "Don't worry about it! We'll get this working in no time! 🌈",
    ],
  };

  const contextMessages = messages[context];
  return contextMessages[Math.floor(Math.random() * contextMessages.length)];
}

/**
 * Utility function for responsive text sizing
 */
export function getResponsiveText(size: "sm" | "md" | "lg" | "xl"): string {
  const sizes = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  };
  return sizes[size];
}

/**
 * Utility function for consistent button sizing
 */
export function getButtonSize(size: "sm" | "md" | "lg" | "xl"): string {
  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[32px]",
    md: "px-4 py-2 text-base min-h-[40px]",
    lg: "px-6 py-3 text-lg min-h-[48px]",
    xl: "px-8 py-4 text-xl min-h-[56px]",
  };
  return sizes[size];
}
