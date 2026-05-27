import type { MetadataRoute } from "next";
import { storeConfig } from "@/lib/store-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/orders", "/checkout/success"],
    },
    sitemap: `${storeConfig.siteUrl}/sitemap.xml`,
  };
}