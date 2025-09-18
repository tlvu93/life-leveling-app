/**
 * Enhanced API client with error handling and user feedback
 */

import {
  LifeLevelingError,
  ErrorCodes,
  createNetworkError,
  createAuthError,
  withRetry,
} from "./error-handler";

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
    this.timeout = options.timeout || 10000; // 10 seconds
    this.retries = options.retries || 2;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHttpError(response, fullUrl);
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new LifeLevelingError(
            ErrorCodes.TIMEOUT_ERROR,
            `Request timeout after ${this.timeout}ms`,
            "The request is taking longer than expected. Please try again! ⏰",
            "medium",
            { url: fullUrl, timeout: this.timeout }
          );
        }

        if (error.message.includes("Failed to fetch")) {
          throw createNetworkError(fullUrl);
        }
      }

      throw error;
    }
  }

  private async handleHttpError(
    response: Response,
    url: string
  ): Promise<never> {
    const status = response.status;
    const statusText = response.statusText;

    // Try to get error details from response body
    let errorDetails: any = {};
    try {
      errorDetails = await response.json();
    } catch {
      // Ignore JSON parsing errors
    }

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        throw new LifeLevelingError(
          ErrorCodes.VALIDATION_ERROR,
          `Bad Request: ${statusText}`,
          errorDetails.message ||
            "There's an issue with the information you provided. Let's fix it together! 📝",
          "low",
          { url, status, statusText, details: errorDetails }
        );

      case 401:
        throw createAuthError("required");

      case 403:
        throw createAuthError("denied");

      case 404:
        throw new LifeLevelingError(
          ErrorCodes.DATA_NOT_FOUND,
          `Not Found: ${statusText}`,
          "We couldn't find what you're looking for. It might have moved! 🔍",
          "low",
          { url, status, statusText }
        );

      case 409:
        throw new LifeLevelingError(
          ErrorCodes.DATA_CONFLICT,
          `Conflict: ${statusText}`,
          errorDetails.message ||
            "There's a conflict with existing data. Let's resolve this! 🤝",
          "medium",
          { url, status, statusText, details: errorDetails }
        );

      case 429:
        throw new LifeLevelingError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          `Rate Limit Exceeded: ${statusText}`,
          "Whoa there! You're going too fast. Take a quick breather and try again! 🐌",
          "medium",
          { url, status, statusText }
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new LifeLevelingError(
          ErrorCodes.API_ERROR,
          `Server Error: ${status} ${statusText}`,
          "Our servers are having a moment. We're on it! Try again in a bit. ⚡",
          "high",
          { url, status, statusText, details: errorDetails }
        );

      default:
        throw createNetworkError(url, status, statusText);
    }
  }

  // HTTP Methods with retry logic
  async get<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () => this.makeRequest<T>(url, { ...options, method: "GET" }),
      this.retries
    );
  }

  async post<T>(
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () =>
        this.makeRequest<T>(url, {
          ...options,
          method: "POST",
          body: data ? JSON.stringify(data) : undefined,
        }),
      this.retries
    );
  }

  async put<T>(
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () =>
        this.makeRequest<T>(url, {
          ...options,
          method: "PUT",
          body: data ? JSON.stringify(data) : undefined,
        }),
      this.retries
    );
  }

  async patch<T>(
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () =>
        this.makeRequest<T>(url, {
          ...options,
          method: "PATCH",
          body: data ? JSON.stringify(data) : undefined,
        }),
      this.retries
    );
  }

  async delete<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () => this.makeRequest<T>(url, { ...options, method: "DELETE" }),
      this.retries
    );
  }

  // Utility methods
  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders["Authorization"];
  }

  setHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string) {
    delete this.defaultHeaders[key];
  }
}

// Default API client instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  timeout: 10000,
  retries: 2,
});

// Convenience functions for common operations
export const api = {
  get: <T>(url: string, options?: RequestInit) =>
    apiClient.get<T>(url, options),
  post: <T>(url: string, data?: any, options?: RequestInit) =>
    apiClient.post<T>(url, data, options),
  put: <T>(url: string, data?: any, options?: RequestInit) =>
    apiClient.put<T>(url, data, options),
  patch: <T>(url: string, data?: any, options?: RequestInit) =>
    apiClient.patch<T>(url, data, options),
  delete: <T>(url: string, options?: RequestInit) =>
    apiClient.delete<T>(url, options),
};
