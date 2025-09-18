"use client";

import React from "react";
import { Alert } from "./alert";
import { Button } from "./button";
import { Card, CardContent, CardFooter } from "./card";
import { getEncouragingMessage } from "@/lib/ui-utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  encouragingMessage?: string;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          encouragingMessage={getEncouragingMessage("error")}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  encouragingMessage,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-error-50 to-warning-50">
      <Card className="max-w-md w-full" variant="elevated">
        <CardContent className="text-center py-8">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-error-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Oops! Something went wrong
          </h2>

          <p className="text-neutral-600 mb-6">
            {encouragingMessage ||
              "Don't worry, this happens sometimes! Let's get you back on track."}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <Alert variant="error" className="mb-6 text-left">
              <details>
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs overflow-auto max-h-32 bg-error-50 p-2 rounded">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            </Alert>
          )}
        </CardContent>

        <CardFooter justify="center">
          <Button
            onClick={resetError}
            variant="primary"
            size="lg"
            playful
            className="min-w-[120px]"
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    // Log error
    console.error("Error caught by useErrorHandler:", error, errorInfo);

    // You could also send to error reporting service here
    // Example: Sentry.captureException(error);
  };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

export { ErrorBoundary };
export type { ErrorBoundaryProps, ErrorFallbackProps };
