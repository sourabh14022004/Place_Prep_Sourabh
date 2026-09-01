"use client";

/**
 * dashboard/student-portal/components/ErrorState.tsx
 * Shared full-page error fallback. Every page used to gate on isLoading alone,
 * so a failed fetch rendered the spinner branch forever. Pages now destructure
 * `error` and render this instead — it gives the user a real message and a way
 * to recover, instead of an infinite spinner.
 *
 * Usage:
 *   const { data, isLoading, error, mutate } = useX();
 *   if (error) return <ErrorState error={error} onRetry={mutate} />;
 *   if (isLoading) return <PageSkeleton />;
 */

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  /** Error object thrown by the failing hook/request. */
  error: unknown;
  /** Called when the user clicks "Try again". Usually a SWR `mutate`. */
  onRetry?: () => void;
  /** Optional title for the error card. Defaults to "Couldn't load this page". */
  title?: string;
}

export default function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong while loading this page.";

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          {title ?? "Couldn't load this page"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
