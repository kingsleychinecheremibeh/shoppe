import type { MetadataRoute } from "next";
import { storeConfig } from "@/lib/store-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/orders", "/checkout/success", "/reset-password"],
    },
    sitemap: `${storeConfig.siteUrl}/sitemap.xml`,
  };
}