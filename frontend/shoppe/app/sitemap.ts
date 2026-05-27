import type { MetadataRoute } from "next";
import { storeConfig } from "@/lib/store-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = storeConfig.siteUrl;

  const routes = [
    "",
    "/products",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/privacy-policy",
    "/terms",
    "/refund-policy",
    "/shipping-policy",
    "/secure-checkout",
    "/contact",
    "/faq",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/products" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.6,
  }));
}