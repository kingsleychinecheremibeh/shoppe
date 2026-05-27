import Link from "next/link";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { storeConfig } from "@/lib/store-config";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    {
      label: "Instagram",
      href: storeConfig.socialLinks.instagram,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
        </svg>
      ),
    },
    {
      label: "Twitter",
      href: storeConfig.socialLinks.twitter,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: storeConfig.socialLinks.facebook,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
          <path d="M14 8.5h2V5h-2.5C10.9 5 9 6.9 9 9.5V12H7v3.5h2V22h4v-6.5h2.7L16 12h-3V9.8c0-.8.4-1.3 1-1.3Z" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: storeConfig.socialLinks.tiktok,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
          <path d="M16.6 5.8A5.4 5.4 0 0 0 19.8 7v3.4a8.3 8.3 0 0 1-3.2-.7v5.5A6.1 6.1 0 1 1 10.5 9v3.5a2.7 2.7 0 1 0 2.7 2.7V2h3.4v3.8Z" />
        </svg>
      ),
    },
  ].filter((link) => link.href);

  return (
    <footer className="bg-white border-t border-gray-200 py-16 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Footprint Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12 border-b border-gray-100 pb-12">
          
          {/* Column 1: Brand Narrative */}
          <div className="md:col-span-4 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-black tracking-tight text-gray-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-950 text-white">
                <ShoppingBag className="h-4.5 w-4.5" />
              </span>
              SHOPPE
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs font-sans">
              Sourced globally, curated locally. Premium clothing, objects, and functional utilities designed to elevate the quiet details of everyday life.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 pt-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-gray-400 hover:text-gray-950 transition"
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Shop */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shop</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/products" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                All Products
              </Link>
              <Link href="/cart" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Cart
              </Link>
              <Link href="/login" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Login
              </Link>
              <Link href="/register" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Create Account
              </Link>
            </nav>
          </div>

          {/* Column 3: Customer Care */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer Care</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/shipping-policy" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition inline-flex items-center gap-1">
                Shipping & Returns <ArrowUpRight className="h-3 w-3 text-gray-400" />
              </Link>
              <Link href="/faq" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                FAQ
              </Link>
              <Link href="/secure-checkout" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Secure Checkout
              </Link>
              <Link href="/privacy-policy" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Column 4: Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Need help with an order, delivery, or return? Contact our support team.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${storeConfig.supportEmail}`}
                className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition"
              >
                {storeConfig.supportEmail}
              </a>
              <a
                href={`tel:${storeConfig.supportPhone}`}
                className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition"
              >
                {storeConfig.supportPhone}
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-400 font-medium">
            &copy; {currentYear} SHOPPE. All rights reserved. Sourced globally, curated locally.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-[11px] text-gray-400 hover:text-gray-950 transition font-medium">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="text-[11px] text-gray-400 hover:text-gray-950 transition font-medium">
              Refund Policy
            </Link>
            <Link href="/privacy-policy" className="text-[11px] text-gray-400 hover:text-gray-950 transition font-medium">
              Privacy Settings
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
