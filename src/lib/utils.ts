import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `catch (error)` binds `unknown`. These helpers pull the useful bits out
 * without sprinkling `any` or non-null assertions through every catch block.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

/** Postgres drivers attach `code`/`severity`/`constraint` to thrown errors. */
export function getErrorDetails(error: unknown): {
  name: string;
  message: string;
  code?: string;
  severity?: string;
} {
  const record =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};

  return {
    name: error instanceof Error ? error.name : typeof error,
    message: getErrorMessage(error),
    code: typeof record.code === "string" ? record.code : undefined,
    severity: typeof record.severity === "string" ? record.severity : undefined,
  };
}
