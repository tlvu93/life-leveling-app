"use client";

import React from "react";
import { clsx } from "clsx";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  variant?: "default" | "muted";
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, variant = "default", children, ...props }, ref) => {
    const baseClasses = [
      "text-sm font-medium leading-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    ];

    const variantClasses = {
      default: "text-foreground",
      muted: "text-muted-foreground",
    };

    return (
      <label
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };
