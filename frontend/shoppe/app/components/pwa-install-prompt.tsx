"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

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

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-60 transition-transform duration-500 ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      role="banner"
      aria-label="Install app"
    >
      <div className="bg-gray-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 min-w-0">
            <Download className="h-4 w-4 shrink-0 opacity-70" />
            <p className="truncate text-[11px] font-medium sm:text-xs">
              Install <span className="font-bold">Shoppe</span> for a faster,
              app-like experience
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md bg-white px-3.5 py-1 text-[11px] font-bold text-gray-950 uppercase tracking-wider transition hover:bg-gray-100 active:scale-95"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-600 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss install banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
