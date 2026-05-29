"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        // Service worker registration failed — log for debugging but do not rethrow.
        // This prevents an unhandled Promise rejection from surfacing as an error.
        console.warn("[SW] Registration failed:", err);
      });
  }, []);

  return null;
}