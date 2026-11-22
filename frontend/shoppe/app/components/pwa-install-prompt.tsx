"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { LogoMark } from "@/app/components/logo";

// Extend the Window interface to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("pwa-banner-dismissed") === "true";
    }
    return false;
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      // Small delay for a smooth slide-in animation
      requestAnimationFrame(() => {
        setTimeout(() => setIsVisible(true), 100);
      });
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  }, []);

  // Don't render anything if no prompt is available or the banner was dismissed
  if (!deferredPrompt || dismissed) return null;
  // Never cover the checkout flow (it has its own sticky Pay bar on phones), and skip staff pages.
  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-60 transition-all duration-500 ease-out sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
      }`}
      role="region"
      aria-label="Install app"
    >
      <div className="flex items-center gap-3 rounded-lg border-[1.5px] border-ink bg-white p-3 shadow-sticker">
        <LogoMark size={44} />
        <p className="min-w-0 flex-1 text-sm leading-snug font-medium text-ink">
          Add Shoppe to your home screen for faster shopping
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="h-10 shrink-0 rounded-lg bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-black"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-gray-100"
          aria-label="Dismiss install prompt"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
