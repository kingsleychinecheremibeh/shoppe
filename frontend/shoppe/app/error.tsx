"use client"; // Error boundaries must be client components

import { useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { ui } from "@/lib/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun shadow-sticker">
        <HugeiconsIcon icon={Alert02Icon} size={52} strokeWidth={1.4} />
      </span>
      <h1 className="mt-6 text-5xl leading-none font-extrabold tracking-[-0.04em] text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-md text-base text-gray-700">This page didn&apos;t load properly. Give it another go.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className={ui.primary}>
          <HugeiconsIcon icon={RefreshIcon} size={22} strokeWidth={1.8} />
          Try again
        </button>
        <Link href="/" className={ui.secondary}>
          Go home
        </Link>
      </div>
    </main>
  );
}
