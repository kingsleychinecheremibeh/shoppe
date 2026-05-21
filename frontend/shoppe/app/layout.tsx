import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Header } from "@/app/components/header";
import { Footer } from "@/app/components/footer";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
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
