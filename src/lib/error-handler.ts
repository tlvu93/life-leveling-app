/**
 * Global error handling utilities for the Life Leveling app
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
  timestamp: Date;
}

export class LifeLevelingError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: "low" | "medium" | "high" | "critical";
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
    context?: Record<string, any>
  ) {
    super(message);
    this.name = "LifeLevelingError";
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LifeLevelingError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Predefined error types for common scenarios
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  API_ERROR: "API_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Authentication errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Data errors
  DATA_NOT_FOUND: "DATA_NOT_FOUND",
  DATA_CONFLICT: "DATA_CONFLICT",
  DATA_CORRUPTION: "DATA_CORRUPTION",

  // User experience errors
  FEATURE_UNAVAILABLE: "FEATURE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // System errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE",
} as const;

/**
 * Age-appropriate error messages
 */
export const getAgeAppropriateErrorMessage = (
  errorCode: string,
  ageGroup: "child" | "teen" | "adult" = "teen"
): string => {
  const messages = {
    [ErrorCodes.NETWORK_ERROR]: {
      child:
        "Oops! The internet seems to be playing hide and seek. Let's try again! 🌐",
      teen: "Looks like there's a connection issue. Check your internet and try again! 📶",
      adult:
        "Network connection error. Please check your internet connection and retry.",
    },
    [ErrorCodes.API_ERROR]: {
      child:
        "Something got mixed up on our end. Don't worry, we're fixing it! 🔧",
      teen: "Our servers are having a moment. We're on it! Try again in a bit. ⚡",
      adult:
        "Server error occurred. Our team has been notified. Please try again later.",
    },
    [ErrorCodes.AUTH_REQUIRED]: {
      child: "You need to sign in first to use this cool feature! 🔑",
      teen: "You'll need to log in to access this feature. Quick and easy! 🚪",
      adult: "Authentication required. Please log in to continue.",
    },
    [ErrorCodes.VALIDATION_ERROR]: {
      child: "Hmm, something doesn't look quite right. Let's double-check! ✏️",
      teen: "There's a small issue with what you entered. Mind taking another look? 👀",
      adult:
        "Please review the information you've entered and correct any errors.",
    },
    [ErrorCodes.DATA_NOT_FOUND]: {
      child:
        "We couldn't find what you're looking for. Maybe it's on an adventure! 🗺️",
      teen: "That item seems to have vanished! Try searching for something else. 🔍",
      adult:
        "The requested data could not be found. It may have been moved or deleted.",
    },
    [ErrorCodes.FEATURE_UNAVAILABLE]: {
      child:
        "This awesome feature is taking a little nap right now. Check back soon! 😴",
      teen: "This feature is temporarily unavailable. We're working on making it even better! 🚧",
      adult: "This feature is currently unavailable. Please try again later.",
    },
    [ErrorCodes.UNKNOWN_ERROR]: {
      child:
        "Something unexpected happened, but don't worry! We'll figure it out together. 🤝",
      teen: "Whoops! Something went wrong, but it's nothing we can't handle. Let's try again! 💪",
      adult:
        "An unexpected error occurred. Please try again or contact support if the issue persists.",
    },
  };

  return (
    messages[errorCode]?.[ageGroup] ||
    messages[ErrorCodes.UNKNOWN_ERROR][ageGroup]
  );
};

/**
 * Error severity levels and their handling
 */
export const getErrorHandlingStrategy = (severity: AppError["severity"]) => {
  switch (severity) {
    case "low":
      return {
        showToast: true,
        logError: false,
        reportError: false,
        blockUI: false,
        autoRetry: true,
        retryCount: 3,
      };
    case "medium":
      return {
        showToast: true,
        logError: true,
        reportError: false,
        blockUI: false,
        autoRetry: true,
        retryCount: 2,
      };
    case "high":
      return {
        showToast: true,
        logError: true,
        reportError: true,
        blockUI: true,
        autoRetry: false,
        retryCount: 0,
      };
    case "critical":
      return {
        showToast: true,
        logError: true,
        reportError: true,
        blockUI: true,
        autoRetry: false,
        retryCount: 0,
        redirectToError: true,
      };
  }
};

/**
 * Global error handler function
 */
export const handleError = (
  error: Error | LifeLevelingError,
  context?: Record<string, any>
): AppError => {
  let appError: AppError;

  if (error instanceof LifeLevelingError) {
    appError = error.toJSON();
  } else {
    // Convert generic errors to AppError
    appError = {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
      userMessage: getAgeAppropriateErrorMessage(ErrorCodes.UNKNOWN_ERROR),
      severity: "medium",
      context: { ...context, originalError: error.name },
      timestamp: new Date(),
    };
  }

  // Log error based on severity
  const strategy = getErrorHandlingStrategy(appError.severity);

  if (strategy.logError) {
    console.error("LifeLeveling Error:", {
      ...appError,
      stack: error.stack,
    });
  }

  // Report error to monitoring service (in production)
  if (strategy.reportError && process.env.NODE_ENV === "production") {
    // Here you would integrate with error reporting service like Sentry
    // Sentry.captureException(error, { extra: appError });
  }

  return appError;
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }

  throw lastError!;
};

/**
 * Validation error helpers
 */
export const createValidationError = (
  field: string,
  message: string,
  value?: any
): LifeLevelingError => {
  return new LifeLevelingError(
    ErrorCodes.VALIDATION_ERROR,
    `Validation failed for field: ${field}`,
    getAgeAppropriateErrorMessage(ErrorCodes.VALIDATION_ERROR),
    "low",
    { field, value, validationMessage: message }
  );
};

/**
 * Network error helpers
 */
export const createNetworkError = (
  url: string,
  status?: number,
  statusText?: string
): LifeLevelingError => {
  const severity = status && status >= 500 ? "high" : "medium";

  return new LifeLevelingError(
    ErrorCodes.NETWORK_ERROR,
    `Network request failed: ${status} ${statusText}`,
    getAgeAppropriateErrorMessage(ErrorCodes.NETWORK_ERROR),
    severity,
    { url, status, statusText }
  );
};

/**
 * Authentication error helpers
 */
export const createAuthError = (
  reason: "required" | "expired" | "denied"
): LifeLevelingError => {
  const codes = {
    required: ErrorCodes.AUTH_REQUIRED,
    expired: ErrorCodes.AUTH_EXPIRED,
    denied: ErrorCodes.PERMISSION_DENIED,
  };

  return new LifeLevelingError(
    codes[reason],
    `Authentication error: ${reason}`,
    getAgeAppropriateErrorMessage(codes[reason]),
    "medium",
    { reason }
  );
};
