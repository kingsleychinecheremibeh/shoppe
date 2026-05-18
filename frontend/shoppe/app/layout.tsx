import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Shoppe",
    default: "Shoppe — Curated Objects of Design",
  },
  description: "Sourced globally, curated locally. Premium clothing, objects, and accessories crafted for modern life.",
  keywords: ["Shoppe", "Curated Design", "Luxury Clothing", "Designer Accessories", "Minimalist Living", "Home Decor", "Premium Fashion"],
  authors: [{ name: "Shoppe Design Team" }],
  creator: "Shoppe",
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shoppe — Curated Objects of Design",
    description: "Sourced globally, curated locally. Premium clothing, objects, and accessories crafted for modern life.",
    url: "https://shoppe.com",
    siteName: "Shoppe",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoppe — Curated Objects of Design",
    description: "Sourced globally, curated locally. Premium clothing, objects, and accessories crafted for modern life.",
    creator: "@shoppe",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
