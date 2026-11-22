import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { CartDrawer } from "@/app/components/cart-drawer";
import { DevServiceWorkerCleanup } from "@/app/components/dev-service-worker-cleanup";
import { ServiceWorkerRegistration } from "@/app/components/service-worker-registration";
import { PwaInstallPrompt } from "@/app/components/pwa-install-prompt";
import { Analytics } from "@vercel/analytics/next";
import { Clarity } from "@/app/components/clarity";
import {storeConfig } from "@/lib/store-config";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${storeConfig.storeName}`,
    default: `${storeConfig.storeName} · Tech, fashion, beauty & home delivered across Nigeria`,
  },
  description: "Shop gadgets, fashion, shoes, beauty and home picks at fair prices. Pay with card, bank transfer or USSD, with delivery across Nigeria in 2-5 business days.",
  keywords: ["Shoppe", "online shopping Nigeria", "electronics", "fashion", "shoes", "beauty", "home and living", "Lagos", "Paystack"],
  authors: [{ name: storeConfig.storeName }],
  creator: storeConfig.storeName,
  manifest: "/manifest.json",
  metadataBase: new URL(storeConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${storeConfig.storeName} · Tech, fashion, beauty & home delivered across Nigeria`,
    description: "Shop gadgets, fashion, shoes, beauty and home picks at fair prices. Pay with card, bank transfer or USSD, with delivery across Nigeria in 2-5 business days.",
    url: storeConfig.siteUrl,
    siteName: storeConfig.storeName,
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${storeConfig.storeName} · Tech, fashion, beauty & home delivered across Nigeria`,
    description: "Shop gadgets, fashion, shoes, beauty and home picks at fair prices. Pay with card, bank transfer or USSD, with delivery across Nigeria in 2-5 business days.",
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
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DevServiceWorkerCleanup />
        <ServiceWorkerRegistration />
        <PwaInstallPrompt />
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <CartDrawer />
        <Toaster position="top-right" toastOptions={{ className: "rounded-lg! border-[1.5px]! border-ink! shadow-sticker-sm! font-sans!" }} />
        {process.env.NODE_ENV === "production" && (
          <>
            <Analytics />
            <Clarity />
          </>
        )}
      </body>
    </html>
  );
}
