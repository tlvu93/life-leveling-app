"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/ui-utils";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const variantClasses = {
    info: [
      "bg-primary-50 border-primary-200 text-primary-800",
      "dark:bg-primary-950 dark:border-primary-800 dark:text-primary-200",
    ],
    success: [
      "bg-success-50 border-success-200 text-success-800",
      "dark:bg-success-950 dark:border-success-800 dark:text-success-200",
    ],
    warning: [
      "bg-warning-50 border-warning-200 text-warning-800",
      "dark:bg-warning-950 dark:border-warning-800 dark:text-warning-200",
    ],
    error: [
      "bg-error-50 border-error-200 text-error-800",
      "dark:bg-error-950 dark:border-error-800 dark:text-error-200",
    ],
  };

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 shadow-medium backdrop-blur-sm",
        "transform transition-all duration-200 ease-out",
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        isLeaving && "scale-95",
        variantClasses[toast.variant || "info"]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.variant || "info"]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold mb-1 text-sm">{toast.title}</h4>
          )}
          <p className="text-sm">{toast.message}</p>

          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        {toast.dismissible && (
          <button
            onClick={handleRemove}
            className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast();
  return (
    message: string,
    options?: Partial<Omit<Toast, "id" | "variant" | "message">>
  ) => addToast({ ...options, message, variant: "success" });
}

export function useErrorToast() {
  const { addToast } = useToast();
  return (
    message: string,
    options?: Partial<Omit<Toast, "id" | "variant" | "message">>
  ) => addToast({ ...options, message, variant: "error" });
}

export function useWarningToast() {
  const { addToast } = useToast();
  return (
    message: string,
    options?: Partial<Omit<Toast, "id" | "variant" | "message">>
  ) => addToast({ ...options, message, variant: "warning" });
}

export function useInfoToast() {
  const { addToast } = useToast();
  return (
    message: string,
    options?: Partial<Omit<Toast, "id" | "variant" | "message">>
  ) => addToast({ ...options, message, variant: "info" });
}
