import type { MetadataRoute } from "next";
import { storeConfig } from "@/lib/store-config";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api/v1" : "");

type Listing = { id: string; slug?: string; updatedAt?: string };

const fetchList = async (path: string): Promise<Listing[]> => {
  if (!API_BASE) return [];
  try {
    const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const body = await response.json();
    return (Array.isArray(body) ? body : body?.data || []) as Listing[];
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = storeConfig.siteUrl;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, changeFrequency: "weekly", priority: 0.7 },
    ...["/faq", "/contact", "/shipping-policy", "/refund-policy", "/secure-checkout", "/privacy-policy", "/terms"].map(
      (route) => ({ url: `${baseUrl}${route}`, changeFrequency: "monthly" as const, priority: 0.4 })
    ),
  ];

  const [products, categories] = await Promise.all([
    fetchList("/products?limit=100"),
    fetchList("/categories"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => category.slug)
    .map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
