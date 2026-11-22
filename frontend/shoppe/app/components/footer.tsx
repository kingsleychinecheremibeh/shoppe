import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  Facebook01Icon,
  InstagramIcon,
  Mail01Icon,
  NewTwitterIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { LogoMark } from "@/app/components/logo";
import { storeConfig } from "@/lib/store-config";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?sort=newest", label: "New in" },
      { href: "/categories", label: "Categories" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping-policy", label: "Shipping & returns" },
      { href: "/refund-policy", label: "Refunds" },
      { href: "/secure-checkout", label: "Secure checkout" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Create account" },
      { href: "/account/orders", label: "My orders" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { label: "Instagram", href: storeConfig.socialLinks.instagram, icon: InstagramIcon },
    { label: "X (Twitter)", href: storeConfig.socialLinks.twitter, icon: NewTwitterIcon },
    { label: "Facebook", href: storeConfig.socialLinks.facebook, icon: Facebook01Icon },
    { label: "TikTok", href: storeConfig.socialLinks.tiktok, icon: TiktokIcon },
  ].filter((link) => link.href);

  return (
    <footer className="mt-auto overflow-hidden bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-10 md:grid-cols-12 md:pb-12">
          {/* Brand + contact */}
          <div className="space-y-5 md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={`${storeConfig.storeName} home`}>
              <LogoMark size={48} tone="dark" />
            </Link>
            <p className="max-w-xs text-[15px] leading-relaxed text-gray-300">
              Everyday tech, fashion, beauty and home, delivered across Nigeria in {storeConfig.deliveryTime}.
            </p>
            <div className="flex flex-col gap-2 text-[15px]">
              <a href={`mailto:${storeConfig.supportEmail}`} className="inline-flex items-center gap-2.5 break-all text-paper hover:text-sun">
                <HugeiconsIcon icon={Mail01Icon} size={22} strokeWidth={1.6} className="shrink-0" />
                {storeConfig.supportEmail}
              </a>
              <a href={`tel:${storeConfig.supportPhone}`} className="inline-flex items-center gap-2.5 text-paper hover:text-sun">
                <HugeiconsIcon icon={Call02Icon} size={22} strokeWidth={1.6} className="shrink-0" />
                {storeConfig.supportPhone}
              </a>
            </div>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 text-paper transition hover:border-sun hover:bg-sun hover:text-ink"
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={link.icon} size={22} strokeWidth={1.6} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link groups: side by side on phones, three columns on larger screens */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:col-span-7 lg:col-span-7 lg:col-start-6">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title} className="space-y-3">
                <h3 className="font-mono text-xs font-semibold tracking-wider text-sun uppercase">{column.title}</h3>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-block py-0.5 text-[15px] text-paper transition hover:text-sun">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 py-6 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {currentYear} {storeConfig.storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-paper">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-paper">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-paper">Refund policy</Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="mx-auto max-w-7xl px-4 font-display text-[28vw] leading-[0.74] font-extrabold tracking-[-0.06em] text-sun select-none sm:px-6 lg:px-8 lg:text-[22rem]"
      >
        shoppe
      </div>
    </footer>
  );
}
