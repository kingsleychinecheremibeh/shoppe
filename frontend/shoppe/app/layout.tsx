import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { DevServiceWorkerCleanup } from "@/app/components/dev-service-worker-cleanup";
import { ServiceWorkerRegistration } from "@/app/components/service-worker-registration";
import { PwaInstallPrompt } from "@/app/components/pwa-install-prompt";
import { Analytics } from "@vercel/analytics/next";
import {storeConfig } from "@/lib/store-config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: `%s | ${storeConfig.storeName}`,
    default: `${storeConfig.storeName} - Curated Objects of Design`,
  },
  description:  "Shop premium clothing, accessories, and lifestyle products curated for modern everyday living.",
  keywords: ["Shoppe", "Ecommerce", "Online Store", "Clothing", "Accessories", "Fashion",  "Lifestyle Products",],
  authors: [{ name: storeConfig.storeName }],
  creator: storeConfig.storeName,
  manifest: "/manifest.json",
  metadataBase: new URL(storeConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${storeConfig.storeName} - Curated Objects of Design`,
    description: "Shop premium clothing, accessories, and lifestyle products curated for modern everyday living.",
    url: storeConfig.siteUrl,
    siteName: storeConfig.storeName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${storeConfig.storeName} - Curated Objects of Design`,
    description: "Shop premium clothing, accessories, and lifestyle products curated for modern everyday living.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: storeConfig.storeName,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <DevServiceWorkerCleanup />
        <ServiceWorkerRegistration />
        <PwaInstallPrompt />
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
