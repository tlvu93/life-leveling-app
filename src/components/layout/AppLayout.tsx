"use client";

import React from "react";
import { cn } from "@/lib/ui-utils";
import { SkipToMain } from "@/components/accessibility/AccessibilityHelpers";

export interface AppLayoutProps {
  children: React.ReactNode;
  variant?: "default" | "playful" | "centered";
  className?: string;
  showBackground?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  variant = "default",
  className,
  showBackground = true,
}) => {
  const baseClasses = ["min-h-screen transition-all duration-300"];

  const variantClasses = {
    default: [showBackground && "bg-background"],
    playful: [showBackground && "bg-background"],
    centered: [
      showBackground && "bg-background",
      "flex items-center justify-center p-4",
    ],
  };

  return (
    <>
      <SkipToMain />
      <div className={cn(baseClasses, variantClasses[variant], className)}>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 mx-2 text-neutral-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1
            className="text-3xl font-bold font-display text-neutral-900 dark:text-neutral-100 mb-2"
            tabIndex={-1}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-lg text-neutral-600 dark:text-neutral-400"
              id={`${title.toLowerCase().replace(/\s+/g, "-")}-description`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div
            className="flex-shrink-0 ml-6"
            role="toolbar"
            aria-label="Page actions"
          >
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  className,
}) => {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
}

const Section: React.FC<SectionProps> = ({
  children,
  className,
  spacing = "md",
}) => {
  const spacingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-20",
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
};

export { AppLayout, PageHeader, Container, Section };
