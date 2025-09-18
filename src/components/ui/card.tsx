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
      "rounded-xl transition-all duration-200",
      interactive && [
        "cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      ],
      glowing && "hover:shadow-lg",
    ];

    const variantClasses = {
      default: [
        "bg-white border-0 shadow-sm",
        "dark:bg-card dark:border dark:border-border",
        interactive && "hover:shadow-md transition-shadow duration-200",
      ],
      elevated: [
        "bg-white shadow-lg border-0",
        "dark:bg-card dark:shadow-xl",
        interactive && "hover:shadow-xl transition-shadow duration-200",
      ],
      outlined: [
        "bg-white border border-gray-200",
        "dark:bg-card dark:border-border",
        interactive && "hover:border-primary/30 hover:shadow-sm",
      ],
      playful: [
        "bg-white border-0 shadow-sm",
        "dark:bg-card",
        interactive && "hover:shadow-md transition-shadow duration-200",
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
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
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
        className={clsx("text-foreground", className)}
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
