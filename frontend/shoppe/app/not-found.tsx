import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { LogoMark } from "@/app/components/logo";
import { ui } from "@/lib/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative">
        <span className="block font-display text-[9rem] leading-none font-extrabold tracking-[-0.06em] text-ink sm:text-[12rem]">404</span>
        <LogoMark size={96} className="absolute -top-6 -right-10 rotate-12" />
      </div>
      <h1 className="mt-4 text-4xl font-extrabold text-ink">This page wandered off</h1>
      <p className="mt-3 max-w-md text-base text-gray-700">The link may be old or mistyped. The shop is still right here.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/products?sort=newest" className={ui.primary}>
          Shop new in
          <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} />
        </Link>
        <Link href="/" className={ui.secondary}>
          Go home
        </Link>
      </div>
    </main>
  );
}
