"use client";

import React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "playful";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  glowing?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      interactive = false,
      glowing = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "rounded-2xl transition-all duration-200",
      interactive && [
        "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      ],
      glowing && "hover:shadow-glow",
    ];

    const variantClasses = {
      default: [
        "bg-white border border-neutral-200 shadow-soft",
        "dark:bg-neutral-900 dark:border-neutral-800",
        interactive && "hover:shadow-medium hover:border-neutral-300",
      ],
      elevated: [
        "bg-white shadow-medium",
        "dark:bg-neutral-900",
        interactive && "hover:shadow-large",
      ],
      outlined: [
        "bg-transparent border-2 border-neutral-200",
        "dark:border-neutral-700",
        interactive && "hover:border-primary-300 hover:bg-primary-50/50",
      ],
      playful: [
        "bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200",
        "dark:from-primary-950 dark:to-secondary-950 dark:border-primary-800",
        interactive && "hover:from-primary-100 hover:to-secondary-100",
      ],
    };

    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("flex items-start justify-between mb-4", className)}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("text-neutral-700 dark:text-neutral-300", className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = "end", ...props }, ref) => {
    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center gap-3 mt-6",
          justifyClasses[justify],
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx(
          "text-lg font-semibold leading-none tracking-tight text-card-foreground",
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={clsx("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
};
