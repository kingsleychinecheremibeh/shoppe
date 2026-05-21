import Link from "next/link";
import { ShoppingBag, ArrowUpRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

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
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-gray-950 transition" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-950 transition" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-950 transition" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  <path d="M9 18c-4.51 2-5-2-7-2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Collections</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/products" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                All Products
              </Link>
              <Link href="/products?category=apparel" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Apparel
              </Link>
              <Link href="/products?category=accessories" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Accessories
              </Link>
              <Link href="/products?category=footwear" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Footwear
              </Link>
            </nav>
          </div>

          {/* Column 3: Customer Care */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer Care</h4>
            <nav className="flex flex-col gap-2">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition inline-flex items-center gap-1">
                Shipping & Returns <ArrowUpRight className="h-3 w-3 text-gray-400" />
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Secure Checkout
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-950 font-medium hover:underline transition">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Column 4: Editorial Signup */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">The Editorial</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Sign up for private sales, lookbooks, and periodic product drop alerts.
            </p>
            <form className="flex gap-2 max-w-sm">
              <input
                id="footerEditorialEmail"
                name="footerEditorialEmail"
                type="email"
                placeholder="email@example.com"
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-950 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                required
              />
              <button
                type="button"
                className="rounded-md bg-gray-950 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-400 font-medium">
            &copy; {currentYear} SHOPPE. All rights reserved. Sourced globally, curated locally.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] text-gray-400 hover:text-gray-950 transition font-medium">
              Terms of Service
            </a>
            <a href="#" className="text-[11px] text-gray-400 hover:text-gray-950 transition font-medium">
              Privacy Settings
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
