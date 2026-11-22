"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Microsoft Clarity (heatmaps + session recordings).
 * Turned on by setting NEXT_PUBLIC_CLARITY_ID in Vercel; does nothing without it.
 * Pages with personal details are masked in recordings so customer data is never captured.
 */
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();
const MASKED_PREFIXES = ["/admin", "/account", "/checkout", "/orders", "/reset-password"];

export function Clarity() {
  const pathname = usePathname();

  useEffect(() => {
    if (!CLARITY_ID) return;
    const sensitive = MASKED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (sensitive) document.body.setAttribute("data-clarity-mask", "true");
    else document.body.removeAttribute("data-clarity-mask");
  }, [pathname]);

  if (!CLARITY_ID || !/^[a-z0-9]+$/i.test(CLARITY_ID)) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
