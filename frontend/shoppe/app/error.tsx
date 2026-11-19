"use client"; // Error boundaries must be client components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // You could log this to an error reporting service like Sentry
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        This page didn&apos;t load properly. Please try again.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
          Go home
        </Link>
      </div>
    </main>
  );
}
