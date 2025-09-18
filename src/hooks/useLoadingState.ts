"use client";

import { useState, useCallback, useRef } from "react";
import { useErrorHandler } from "./useErrorHandler";

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialLoading = false, onError, showErrorToast = true } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const { handleError } = useErrorHandler({
    showToast: showErrorToast,
    onError: onError
      ? (appError) => onError(new Error(appError.message))
      : undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async <T>(
      asyncFunction: (signal?: AbortSignal) => Promise<T>,
      options: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        resetErrorOnStart?: boolean;
      } = {}
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError: localOnError,
        resetErrorOnStart = true,
      } = options;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      if (resetErrorOnStart) {
        setError(null);
      }

      try {
        const result = await asyncFunction(signal);

        // Check if request was aborted
        if (signal.aborted) {
          return null;
        }

        setData(result);
        setError(null);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as Error;

        // Don't handle aborted requests as errors
        if (error.name === "AbortError" || signal.aborted) {
          return null;
        }

        setError(error);
        setData(null);

        // Handle error with toast notification
        handleError(error);

        if (localOnError) {
          localOnError(error);
        }

        return null;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [handleError]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback(
    (error: Error | null) => {
      setError(error);
      if (error) {
        handleError(error);
      }
    },
    [handleError]
  );

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    setLoading: setLoadingState,
    setError: setErrorState,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, Error | null>>({});

  const { handleError } = useErrorHandler();

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback(
    (key: string, error: Error | null) => {
      setErrors((prev) => ({ ...prev, [key]: error }));
      if (error) {
        handleError(error);
      }
    },
    [handleError]
  );

  const execute = useCallback(
    async <T>(
      key: string,
      asyncFunction: () => Promise<T>,
      options: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<T | null> => {
      const { onSuccess, onError } = options;

      setLoading(key, true);
      setError(key, null);

      try {
        const result = await asyncFunction();

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(key, error);

        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        setLoading(key, false);
      }
    },
    [setLoading, setError]
  );

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
      setErrors((prev) => ({ ...prev, [key]: null }));
    } else {
      setLoadingStates({});
      setErrors({});
    }
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const getError = useCallback(
    (key: string) => {
      return errors[key] || null;
    },
    [errors]
  );

  const hasAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  return {
    isLoading,
    getError,
    hasAnyLoading,
    hasAnyError,
    execute,
    setLoading,
    setError,
    reset,
    loadingStates,
    errors,
  };
}

// Hook for debounced loading states (useful for search, etc.)
export function useDebouncedLoadingState(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const { handleError } = useErrorHandler();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async <T>(
      asyncFunction: (signal?: AbortSignal) => Promise<T>,
      options: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<T | null> => {
      const { onSuccess, onError } = options;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;

          setIsLoading(true);
          setError(null);

          try {
            const result = await asyncFunction(signal);

            if (signal.aborted) {
              resolve(null);
              return;
            }

            setData(result);
            setError(null);

            if (onSuccess) {
              onSuccess(result);
            }

            resolve(result);
          } catch (err) {
            const error = err as Error;

            if (error.name === "AbortError" || signal.aborted) {
              resolve(null);
              return;
            }

            setError(error);
            setData(null);

            handleError(error);

            if (onError) {
              onError(error);
            }

            resolve(null);
          } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
          }
        }, delay);
      });
    },
    [delay, handleError]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setError(null);
    setData(null);
  }, [cancel]);

  return {
    isLoading,
    error,
    data,
    execute,
    cancel,
    reset,
  };
}
