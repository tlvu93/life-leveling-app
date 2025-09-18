"use client";

import { useState, useCallback, useMemo } from "react";
import { createValidationError } from "@/lib/error-handler";

export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: ValidationRules;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = validationRules[name];
      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return rule.message || getDefaultErrorMessage("required", name);
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return null;
      }

      // String length validations
      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          return (
            rule.message ||
            getDefaultErrorMessage("minLength", name, rule.minLength)
          );
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return (
            rule.message ||
            getDefaultErrorMessage("maxLength", name, rule.maxLength)
          );
        }
      }

      // Numeric validations
      if (typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          return rule.message || getDefaultErrorMessage("min", name, rule.min);
        }
        if (rule.max !== undefined && value > rule.max) {
          return rule.message || getDefaultErrorMessage("max", name, rule.max);
        }
      }

      // Pattern validation
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        return rule.message || getDefaultErrorMessage("pattern", name);
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          return customError;
        }
      }

      return null;
    },
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [values, validateField, validationRules]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(validateForm()).length === 0;
  }, [validateForm]);

  // Handle field change
  const handleChange = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      if (validateOnChange && touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error || "",
        }));
      }
    },
    [validateField, validateOnChange, touched]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error || "",
        }));
      }
    },
    [validateField, validateOnBlur, values]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);

      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);

      // If there are errors, don't submit
      if (Object.keys(formErrors).length > 0) {
        // Focus on first error field
        const firstErrorField = Object.keys(formErrors)[0];
        const element = document.querySelector(
          `[name="${firstErrorField}"]`
        ) as HTMLElement;
        if (element) {
          element.focus();
        }
        return;
      }

      // Submit form
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("Form submission error:", error);
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [validationRules, validateForm, onSubmit, values]
  );

  // Reset form
  const reset = useCallback(
    (newValues?: Partial<T>) => {
      setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  // Set field error manually
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
  };
}

// Helper function to generate age-appropriate error messages
function getDefaultErrorMessage(
  type: string,
  fieldName: string,
  value?: any
): string {
  const friendlyFieldName = fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  switch (type) {
    case "required":
      return `${friendlyFieldName} is required! Don't forget to fill this in. ✏️`;

    case "minLength":
      return `${friendlyFieldName} needs to be at least ${value} characters long. You're almost there! 📏`;

    case "maxLength":
      return `${friendlyFieldName} can't be longer than ${value} characters. Try to keep it shorter! ✂️`;

    case "min":
      return `${friendlyFieldName} should be at least ${value}. Bump it up a bit! 📈`;

    case "max":
      return `${friendlyFieldName} can't be more than ${value}. Dial it back a little! 📉`;

    case "pattern":
      return `${friendlyFieldName} format doesn't look quite right. Double-check it! 🔍`;

    default:
      return `${friendlyFieldName} has an issue. Let's fix it together! 🤝`;
  }
}

// Common validation rules
export const commonValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message:
      "That doesn't look like a valid email address. Try something like name@example.com! 📧",
  },

  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message:
      "Password needs at least 8 characters with uppercase, lowercase, and a number! 🔐",
  },

  age: {
    min: 6,
    max: 120,
    message: "Age should be between 6 and 120 years! 🎂",
  },

  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message:
      "Username should be 3-20 characters with letters, numbers, and underscores only! 👤",
  },
};
